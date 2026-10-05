import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';
import { formatPrice } from '@/lib/utils';

// Tablero de ventas: cada viaje avanza de cotización → aceptada → reservada → facturada.

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';

interface Card {
  id: string;
  title: string;
  detail: string;
  amount: number;
  label: string;
  tone: Tone;
  targetTab: 'quotes' | 'bookings' | 'invoices';
}

const DAY = 1000 * 60 * 60 * 24;

function daysAgo(date: Date, now: number) {
  return Math.max(0, Math.floor((now - date.getTime()) / DAY));
}

function ago(n: number) {
  if (n === 0) return 'hoy';
  if (n === 1) return 'hace 1 día';
  return `hace ${n} días`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function quoteDetail(items: { description: string }[], pax?: number | null) {
  const first = items[0]?.description ?? 'Sin artículos';
  const more = items.length > 1 ? ` +${items.length - 1}` : '';
  return pax ? `${first}${more} · ${pax} pax` : `${first}${more}`;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
// "2026-10-07" → "7 oct"
function shortDay(iso: string) {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return m && d ? `${d} ${MONTHS[m - 1]}` : iso;
}

const round = (n: number) => Math.round(n * 100) / 100;

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin', 'vendedor']);
  if (!auth.ok) return auth.response;

  const now = Date.now();
  const since = new Date(now - 30 * DAY);

  const [openQuotes, acceptedQuotes, bookings, invoices] = await Promise.all([
    prisma.quote.findMany({
      where: { status: { in: ['borrador', 'enviada'] } },
      include: { client: true, items: true, booking: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.quote.findMany({
      where: { status: 'aceptada', invoice: null },
      include: { client: true, items: true, booking: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.booking.findMany({
      where: { status: 'confirmada', date: { gte: todayIso() } },
      include: { client: true },
      orderBy: { date: 'asc' },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['emitida', 'pagada_parcial', 'pagada'] }, issueDate: { gte: since } },
      include: { client: true, items: true },
      orderBy: { issueDate: 'desc' },
    }),
  ]);

  const cotizacion: Card[] = openQuotes.map((q) => {
    let label: string;
    let tone: Tone;
    if (q.status === 'borrador') {
      label = 'Borrador';
      tone = 'mute';
    } else {
      const n = daysAgo(q.updatedAt, now);
      label = `Enviada ${ago(n)}`;
      tone = n >= 5 ? 'warn' : 'info';
    }
    return {
      id: q.id,
      title: q.client.name,
      detail: `COT-${String(q.number).padStart(4, '0')} · ${quoteDetail(q.items, q.booking?.passengers)}`,
      amount: q.total,
      label,
      tone,
      targetTab: 'quotes',
    };
  });

  const aceptada: Card[] = acceptedQuotes.map((q) => ({
    id: q.id,
    title: q.client.name,
    detail: `COT-${String(q.number).padStart(4, '0')} · ${quoteDetail(q.items, q.booking?.passengers)}`,
    amount: q.total,
    label: `Aceptó ${ago(daysAgo(q.updatedAt, now))}`,
    tone: 'ok',
    targetTab: 'quotes',
  }));

  const reservada: Card[] = bookings.map((b) => {
    const supplierName = b.supplier && !b.itemLabel.includes(b.supplier) ? b.supplier : null;
    const supplier = [supplierName, b.locator].filter(Boolean).join(' · ');
    return {
      id: b.id,
      title: b.client?.name ?? b.customerName,
      detail: `${b.itemLabel} · ${b.passengers} pax${supplier ? ` · ${supplier}` : ''}`,
      amount: b.total,
      label: `Sale ${shortDay(b.date!)}`,
      tone: 'info',
      targetTab: 'bookings',
    };
  });

  const facturada: Card[] = invoices.map((inv) => {
    const balance = round(inv.total - inv.amountPaid);
    const paid = inv.status === 'pagada' || balance <= 0.01;
    const first = inv.items[0]?.description;
    return {
      id: inv.id,
      title: inv.client.name,
      detail: `FAC-${String(inv.number ?? 0).padStart(4, '0')}${first ? ` · ${first}` : ''}`,
      amount: inv.total,
      label: paid ? 'Pagada' : `Saldo ${formatPrice(balance, inv.currency)}`,
      tone: paid ? 'ok' : 'warn',
      targetTab: 'invoices',
    };
  });

  const stage = (id: string, name: string, cards: Card[]) => ({
    id,
    name,
    count: cards.length,
    total: round(cards.reduce((s, c) => s + c.amount, 0)),
    cards,
  });

  return NextResponse.json({
    stages: [
      stage('cotizacion', 'Cotización', cotizacion),
      stage('aceptada', 'Aceptada', aceptada),
      stage('reservada', 'Reservada', reservada),
      stage('facturada', 'Facturada', facturada),
    ],
  });
}
