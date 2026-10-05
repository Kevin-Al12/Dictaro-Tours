import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

// Estados que cuentan como venta facturada.
const BILLED = ['emitida', 'pagada_parcial', 'pagada'];

// República Dominicana está en UTC-4 todo el año (sin horario de verano).
const DR_OFFSET = '-04:00';

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad2 = (n: number) => String(n).padStart(2, '0');

function monthStart(year: number, month: number) {
  // month: 1-12; admite desbordes (0 → diciembre del año anterior, 13 → enero siguiente)
  const y = year + Math.floor((month - 1) / 12);
  const m = ((((month - 1) % 12) + 12) % 12) + 1;
  return { key: `${y}-${pad2(m)}`, date: new Date(`${y}-${pad2(m)}-01T00:00:00${DR_OFFSET}`), y, m };
}

function currentMonthKey() {
  // Mes actual según la hora de RD.
  const dr = new Date(Date.now() - 4 * 3600 * 1000);
  return `${dr.getUTCFullYear()}-${pad2(dr.getUTCMonth() + 1)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const param = req.nextUrl.searchParams.get('month');
  const monthKey = param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) ? param : currentMonthKey();
  const [year, month] = monthKey.split('-').map(Number);

  const start = monthStart(year, month).date;
  const end = monthStart(year, month + 1).date;
  const sixStart = monthStart(year, month - 5).date;

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: BILLED }, issueDate: { gte: sixStart, lt: end } },
      include: {
        client: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { category: true } } } },
      },
      orderBy: { issueDate: 'asc' },
    }),
    prisma.payment.findMany({
      where: { receivedAt: { gte: start, lt: end }, invoice: { status: { not: 'anulada' } } },
      select: { amount: true, method: true },
    }),
  ]);

  const costOf = (inv: (typeof invoices)[number]) =>
    inv.items.reduce((s, it) => s + (it.unitCost ?? 0) * it.quantity, 0);
  // Se reporta sin ITBIS: el impuesto no es ingreso de la agencia.
  const soldOf = (inv: (typeof invoices)[number]) => inv.subtotal;

  // Últimos 6 meses
  const months: { month: string; total: number; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) months.push({ month: monthStart(year, month - i).key, total: 0, profit: 0 });
  const monthIndex = new Map(months.map((m, i) => [m.month, i]));

  const inMonth: typeof invoices = [];
  for (const inv of invoices) {
    const dr = new Date(inv.issueDate.getTime() - 4 * 3600 * 1000);
    const key = `${dr.getUTCFullYear()}-${pad2(dr.getUTCMonth() + 1)}`;
    const idx = monthIndex.get(key);
    if (idx !== undefined) {
      months[idx].total += soldOf(inv);
      months[idx].profit += soldOf(inv) - costOf(inv);
    }
    if (inv.issueDate >= start && inv.issueDate < end) inMonth.push(inv);
  }

  const bySeller = new Map<string, number>();
  const byCategory = new Map<string, number>();
  let total = 0;
  let cost = 0;

  const marginBySale = inMonth.map((inv) => {
    const sold = soldOf(inv);
    const c = costOf(inv);
    total += sold;
    cost += c;
    const seller = inv.createdBy?.name ?? 'Sin asignar';
    bySeller.set(seller, (bySeller.get(seller) ?? 0) + sold);
    for (const it of inv.items) {
      const cat = it.product?.category || 'Otros';
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.subtotal);
    }
    const profit = sold - c;
    return {
      id: inv.id,
      code: inv.number ? `FAC-${String(inv.number).padStart(4, '0')}` : 'Factura',
      clientName: inv.client.name,
      issueDate: inv.issueDate,
      sold: round2(sold),
      cost: round2(c),
      profit: round2(profit),
      margin: sold > 0 ? round2((profit / sold) * 100) : 0,
    };
  });
  marginBySale.sort((a, b) => b.profit - a.profit);

  const byMethod = new Map<string, number>();
  for (const p of payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount);

  const toRows = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([label, value]) => ({ label, total: round2(value) })).sort((a, b) => b.total - a.total);

  const profit = total - cost;

  return NextResponse.json({
    month: monthKey,
    summary: {
      total: round2(total),
      cost: round2(cost),
      profit: round2(profit),
      margin: total > 0 ? round2((profit / total) * 100) : 0,
      count: inMonth.length,
    },
    salesBySeller: toRows(bySeller),
    salesByCategory: toRows(byCategory),
    salesByMonth: months.map((m) => ({ ...m, total: round2(m.total), profit: round2(m.profit) })),
    marginBySale,
    paymentsByMethod: toRows(byMethod),
  });
}
