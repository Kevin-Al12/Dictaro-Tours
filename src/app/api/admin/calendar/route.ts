import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

// Eventos del calendario: salidas de viajes, vencimientos de facturas y de pasaportes.

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';

interface CalendarEvent {
  id: string;
  date: string; // AAAA-MM-DD
  label: string;
  tone: Tone;
  kind: 'salida' | 'factura' | 'pasaporte';
  targetTab: 'bookings' | 'invoices' | 'clients';
}

const pad = (n: number) => String(n).padStart(2, '0');
const pad4 = (n: number | null) => String(n ?? 0).padStart(4, '0');
const localIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Las fechas guardadas como DateTime se leen en UTC para no correrse un día.
const utcIso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const toUtc = (iso: string, extraDays = 0) => {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d + extraDays));
};

const BOOKING_TONE: Record<string, Tone> = { confirmada: 'info', completada: 'ok', pendiente: 'mute' };
const KIND_ORDER: Record<CalendarEvent['kind'], number> = { pasaporte: 0, factura: 1, salida: 2 };

// Junta los eventos entre dos fechas AAAA-MM-DD (ambas incluidas).
async function collectEvents(first: string, last: string, today: string): Promise<CalendarEvent[]> {
  const inRange = (d: string) => d >= first && d <= last;
  // Rango holgado para los DateTime; luego se filtra por la fecha exacta.
  const from = toUtc(first, -1);
  const to = toUtc(last, 2);

  const [bookings, invoices, clients] = await Promise.all([
    prisma.booking.findMany({
      where: { date: { gte: first, lte: `${last}￿` }, status: { not: 'cancelada' } },
      include: { client: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['emitida', 'pagada_parcial'] }, dueDate: { gte: from, lt: to } },
      include: { client: true },
    }),
    prisma.client.findMany({ where: { passportExpiry: { gte: from, lt: to } } }),
  ]);

  const events: CalendarEvent[] = [];

  for (const b of bookings) {
    const date = (b.date ?? '').slice(0, 10);
    if (!inRange(date)) continue;
    const name = b.client?.name ?? b.customerName;
    events.push({
      id: `b-${b.id}`,
      date,
      label: `Sale ${name} · ${b.itemLabel}`,
      tone: BOOKING_TONE[b.status] ?? 'mute',
      kind: 'salida',
      targetTab: 'bookings',
    });
  }

  for (const inv of invoices) {
    if (!inv.dueDate || inv.total - inv.amountPaid <= 0.01) continue;
    const date = utcIso(inv.dueDate);
    if (!inRange(date)) continue;
    events.push({
      id: `i-${inv.id}`,
      date,
      label: `Vence FAC-${pad4(inv.number)} · ${inv.client.name}`,
      tone: date < today ? 'bad' : 'warn',
      kind: 'factura',
      targetTab: 'invoices',
    });
  }

  for (const c of clients) {
    if (!c.passportExpiry) continue;
    const date = utcIso(c.passportExpiry);
    if (!inRange(date)) continue;
    events.push({
      id: `p-${c.id}`,
      date,
      label: `Pasaporte de ${c.name} vence`,
      tone: 'bad',
      kind: 'pasaporte',
      targetTab: 'clients',
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.label.localeCompare(b.label));
  return events;
}

// GET ?month=AAAA-MM (por defecto el mes actual). Devuelve también los próximos 14 días.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin', 'vendedor']);
  if (!auth.ok) return auth.response;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  const param = req.nextUrl.searchParams.get('month');
  if (param) {
    const m = /^(\d{4})-(\d{2})$/.exec(param);
    if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) {
      return NextResponse.json({ error: 'Mes inválido (use AAAA-MM)' }, { status: 400 });
    }
    year = Number(m[1]);
    month = Number(m[2]);
  }

  const monthKey = `${year}-${pad(month)}`;
  const first = `${monthKey}-01`;
  const last = `${monthKey}-${pad(new Date(year, month, 0).getDate())}`;
  const today = localIso(now);
  const upcomingEnd = localIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14));

  const [events, upcoming] = await Promise.all([
    collectEvents(first, last, today),
    collectEvents(today, upcomingEnd, today),
  ]);

  return NextResponse.json({ month: monthKey, today, events, upcoming });
}
