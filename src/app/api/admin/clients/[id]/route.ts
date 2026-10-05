import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintOnField } from '@/lib/prismaErrors';
import { requireRole } from '@/lib/adminRoles';

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';

const code = (prefix: string, n: number | null | undefined) => (n ? `${prefix}-${String(n).padStart(4, '0')}` : null);
const money = (n: number) => `RD$ ${Math.round(n).toLocaleString('en-US')}`;

// Ficha del cliente: datos, viajes, cotizaciones, facturas y una línea de tiempo combinada.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ['owner', 'admin', 'vendedor']);
  if (!auth.ok) return auth.response;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      bookings: { orderBy: { createdAt: 'desc' } },
      quotes: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      invoices: { include: { payments: { orderBy: { receivedAt: 'desc' } } }, orderBy: { issueDate: 'desc' } },
    },
  });
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { passwordHash, ...safeClient } = client;
  void passwordHash;

  const balance = client.invoices
    .filter((inv) => ['emitida', 'pagada_parcial'].includes(inv.status))
    .reduce((sum, inv) => sum + Math.max(inv.total - inv.amountPaid, 0), 0);
  const totalPurchased = client.invoices
    .filter((inv) => !['anulada', 'borrador'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0);
  const trips = client.bookings.filter((b) => b.status !== 'cancelada').length;

  const dates = [client.createdAt, ...client.bookings.map((b) => b.createdAt), ...client.quotes.map((q) => q.createdAt), ...client.invoices.map((i) => i.issueDate)];
  const clientSince = new Date(Math.min(...dates.map((d) => d.getTime())));

  const activity: { date: Date; text: string; tone: Tone }[] = [];
  for (const b of client.bookings) {
    activity.push({ date: b.createdAt, text: `Solicitud de reserva · ${b.itemLabel}`, tone: 'mute' });
    if (b.status === 'confirmada' || b.status === 'completada') {
      // updatedAt cambia con cualquier edición; el voucher siempre se envía después de confirmar.
      const confirmedAt = b.voucherSentAt && b.voucherSentAt < b.updatedAt ? b.voucherSentAt : b.updatedAt;
      activity.push({ date: confirmedAt, text: `Reserva confirmada · ${b.itemLabel}${b.locator ? ` · localizador ${b.locator}` : ''}`, tone: 'ok' });
    }
    if (b.status === 'cancelada') activity.push({ date: b.updatedAt, text: `Reserva cancelada · ${b.itemLabel}`, tone: 'bad' });
    if (b.voucherSentAt) activity.push({ date: b.voucherSentAt, text: `Voucher enviado · ${b.itemLabel}`, tone: 'info' });
  }
  for (const q of client.quotes) {
    const c = code('COT', q.number);
    activity.push({ date: q.createdAt, text: `Cotización ${c} creada · ${money(q.total)}`, tone: 'mute' });
    if (q.status === 'aceptada') activity.push({ date: q.updatedAt, text: `Aceptó la cotización ${c}`, tone: 'ok' });
  }
  for (const inv of client.invoices) {
    if (inv.status === 'borrador') continue;
    const c = code('FAC', inv.number) ?? 'Factura';
    activity.push({ date: inv.issueDate, text: `Factura ${c} emitida · ${money(inv.total)}`, tone: 'info' });
    for (const p of inv.payments) {
      activity.push({ date: p.receivedAt, text: `Pago de ${money(p.amount)} por ${p.method}${p.reference ? ` · ${p.reference}` : ''} (${c})`, tone: 'ok' });
    }
    if (inv.status === 'anulada') {
      activity.push({ date: inv.voidedAt ?? inv.updatedAt, text: `Factura ${c} anulada${inv.voidReason ? ` · ${inv.voidReason}` : ''}`, tone: 'bad' });
    }
  }
  // Más reciente primero; a igual fecha, el evento registrado después (p. ej. "aceptó" tras "creada") va arriba.
  const ordered = activity
    .map((a, i) => ({ a, i }))
    .sort((x, y) => y.a.date.getTime() - x.a.date.getTime() || y.i - x.i)
    .map(({ a }) => a);

  return NextResponse.json({
    client: {
      ...safeClient,
      balance: Math.round(balance * 100) / 100,
      totalPurchased: Math.round(totalPurchased * 100) / 100,
      trips,
      clientSince,
      activity: ordered,
    },
  });
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, phone, email, document, notes, passportNumber, passportExpiry } = body;
  const normalizedEmail = email?.trim().toLowerCase() || null;

  try {
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { name, phone: phone || null, email: normalizedEmail, document: document || null, notes: notes || null,
        ...(passportNumber !== undefined ? { passportNumber: passportNumber?.trim() || null } : {}),
        ...(passportExpiry !== undefined ? { passportExpiry: parseDate(passportExpiry) } : {}),
      },
    });
    return NextResponse.json({ client });
  } catch (err) {
    if (isUniqueConstraintOnField(err, 'email')) {
      return NextResponse.json({ error: 'Ya existe un cliente con ese correo' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar el cliente' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.client.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar el cliente (puede tener cotizaciones asociadas)' }, { status: 400 });
  }
}

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}
