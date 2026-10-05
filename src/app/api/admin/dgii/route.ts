import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

// Estados que cuentan como venta facturada (formato 607).
const BILLED = ['emitida', 'pagada_parcial', 'pagada'];

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad2 = (n: number) => String(n).padStart(2, '0');
const invoiceCode = (n: number | null) => (n ? `FAC-${String(n).padStart(4, '0')}` : 'FAC-0000');

// República Dominicana está en UTC-4 todo el año.
const DR_MS = 4 * 3600 * 1000;
const drDate = (d: Date) => new Date(d.getTime() - DR_MS);
const monthStart = (y: number, m: number) => {
  const yy = y + Math.floor((m - 1) / 12);
  const mm = ((((m - 1) % 12) + 12) % 12) + 1;
  return new Date(`${yy}-${pad2(mm)}-01T00:00:00-04:00`);
};
const yyyymmdd = (d: Date) => {
  const x = drDate(d);
  return `${x.getUTCFullYear()}${pad2(x.getUTCMonth() + 1)}${pad2(x.getUTCDate())}`;
};

function previousPeriod() {
  const now = drDate(new Date());
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-11 → el mes anterior en 1-12
  return m === 0 ? `${y - 1}12` : `${y}${pad2(m)}`;
}

// Cédula: 11 dígitos → tipo 1; RNC: 9 dígitos → tipo 2; otro → en blanco.
function idType(doc: string) {
  if (doc.length === 11) return '1';
  if (doc.length === 9) return '2';
  return '';
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const raw = sp.get('period');
  const period = raw && /^\d{4}(0[1-9]|1[0-2])$/.test(raw) ? raw : previousPeriod();
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(4));
  const start = monthStart(year, month);
  const end = monthStart(year, month + 1);

  const [sales, voided, settings] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: BILLED }, issueDate: { gte: start, lt: end } },
      include: { client: { select: { name: true, document: true } } },
      orderBy: { issueDate: 'asc' },
    }),
    prisma.invoice.findMany({
      where: { status: 'anulada', voidedAt: { gte: start, lt: end } },
      include: { client: { select: { name: true } } },
      orderBy: { voidedAt: 'asc' },
    }),
    prisma.companySettings.findUnique({ where: { id: 'default' } }),
  ]);

  const rnc = (settings?.rnc ?? '').replace(/\D/g, '');
  const format = sp.get('format');

  // IMPORTANTE: este es un formato simplificado (separado por "|") para revisar.
  // El diseño oficial de los formatos 606/607/608 debe confirmarse con el contador
  // y con la DGII (Oficina Virtual / herramienta de pre-validación) antes de presentarlo.
  if (format === '607' || format === '608') {
    const lines: string[] = [];
    if (format === '607') {
      lines.push(`607|${rnc}|${period}|${sales.length}`);
      for (const inv of sales) {
        const doc = (inv.client.document ?? '').replace(/\D/g, '');
        const ncf = inv.ncfNumber?.trim() || `SIN-NCF-${invoiceCode(inv.number)}`;
        lines.push(`${doc}|${idType(doc)}|${ncf}||${yyyymmdd(inv.issueDate)}||${inv.subtotal.toFixed(2)}|${inv.itbis.toFixed(2)}`);
      }
    } else {
      lines.push(`608|${rnc}|${period}|${voided.length}`);
      for (const inv of voided) {
        const ncf = inv.ncfNumber?.trim() || 'SIN-NCF';
        // 05 = corrección de la información (tipo de anulación por defecto; revisar con el contador).
        lines.push(`${ncf}|${yyyymmdd(inv.voidedAt ?? inv.issueDate)}|05`);
      }
    }
    const filename = `DGII_F_${format}_${rnc || 'SINRNC'}_${period}.txt`;
    return new NextResponse(lines.join('\r\n') + '\r\n', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({
    period,
    rnc: settings?.rnc ?? null,
    f606: { available: false },
    f607: {
      count: sales.length,
      subtotal: round2(sales.reduce((s, i) => s + i.subtotal, 0)),
      itbis: round2(sales.reduce((s, i) => s + i.itbis, 0)),
      total: round2(sales.reduce((s, i) => s + i.total, 0)),
      withoutNcf: sales.filter((i) => !i.ncfNumber?.trim()).length,
      rows: sales.map((inv) => ({
        id: inv.id,
        code: invoiceCode(inv.number),
        clientName: inv.client.name,
        document: inv.client.document,
        issueDate: inv.issueDate,
        ncfNumber: inv.ncfNumber,
        subtotal: inv.subtotal,
        itbis: inv.itbis,
        total: inv.total,
      })),
    },
    f608: {
      count: voided.length,
      rows: voided.map((inv) => ({
        id: inv.id,
        code: invoiceCode(inv.number),
        clientName: inv.client.name,
        ncfNumber: inv.ncfNumber,
        voidedAt: inv.voidedAt,
        voidReason: inv.voidReason,
        total: inv.total,
      })),
    },
  });
}
