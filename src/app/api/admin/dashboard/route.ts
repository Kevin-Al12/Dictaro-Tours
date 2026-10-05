import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminRoles';
import { hasFullAccess } from '@/lib/adminRoleConstants';

const DAY_MS = 1000 * 60 * 60 * 24;
const OPEN_INVOICE_STATUSES = ['emitida', 'pagada_parcial'];
const BILLED_STATUSES = ['emitida', 'pagada_parcial', 'pagada'];
// Una cotización enviada sin respuesta en este plazo aparece en "Lo que toca hoy".
const STALE_QUOTE_DAYS = 5;
// Reservas con fecha de viaje dentro de este plazo aparecen como próximas salidas.
const UPCOMING_DAYS = 14;

function toDayKey(d: Date) {
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  const fullAccess = hasFullAccess(session?.role);

  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  const staleBefore = new Date(now.getTime() - STALE_QUOTE_DAYS * DAY_MS);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayKey = toDayKey(now);
  const upcomingLimitKey = toDayKey(new Date(now.getTime() + UPCOMING_DAYS * DAY_MS));

  const [
    clientCount,
    quoteCount,
    bookingCount,
    pendingQuoteCount,
    quoteTotalAgg,
    recentBookings,
    bookingsByStatusRaw,
    pendingQuotesRaw,
    acceptedQuoteCount,
    recentQuotesForTrend,
    upcomingBookingsRaw,
    acceptedNotInvoicedRaw,
    staleQuotesRaw,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.quote.count(),
    prisma.booking.count({ where: { type: 'booking' } }),
    prisma.quote.count({ where: { status: { in: ['borrador', 'enviada'] } } }),
    prisma.quote.aggregate({ _sum: { total: true }, where: { status: { in: ['borrador', 'enviada'] } } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.quote.findMany({
      where: { status: { in: ['borrador', 'enviada'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: true },
    }),
    prisma.quote.count({ where: { status: 'aceptada' } }),
    prisma.quote.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, total: true },
    }),
    // `date` se guarda como texto "AAAA-MM-DD", así que la comparación de texto ordena bien.
    prisma.booking.findMany({
      where: { date: { gte: todayKey, lte: upcomingLimitKey }, status: { not: 'cancelada' } },
      orderBy: { date: 'asc' },
      take: 6,
    }),
    prisma.quote.findMany({
      where: { status: 'aceptada', invoice: null },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { client: true },
    }),
    prisma.quote.findMany({
      where: { status: 'enviada', updatedAt: { lt: staleBefore } },
      orderBy: { updatedAt: 'asc' },
      take: 5,
      include: { client: true },
    }),
  ]);

  const bookingsByStatus = bookingsByStatusRaw.map((b) => ({ status: b.status, count: b._count._all }));

  const pendingQuotes = pendingQuotesRaw.map((q) => ({
    id: q.id,
    number: q.number,
    clientName: q.client.name,
    createdAt: q.createdAt,
    total: q.total,
  }));

  // Cotizaciones creadas por día en los últimos 14 días, para el gráfico de tendencia.
  const quoteTrend: { date: string; count: number; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    quoteTrend.push({ date: toDayKey(d), count: 0, total: 0 });
  }
  for (const q of recentQuotesForTrend) {
    const bucket = quoteTrend.find((d) => d.date === toDayKey(q.createdAt));
    if (bucket) {
      bucket.count += 1;
      bucket.total += q.total;
    }
  }

  const upcomingBookings = upcomingBookingsRaw.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    itemLabel: b.itemLabel,
    date: b.date,
    passengers: b.passengers,
    status: b.status,
  }));

  const acceptedNotInvoiced = acceptedNotInvoicedRaw.map((q) => ({
    id: q.id,
    number: q.number,
    clientName: q.client.name,
    total: q.total,
  }));

  const staleQuotes = staleQuotesRaw.map((q) => ({
    id: q.id,
    number: q.number,
    clientName: q.client.name,
    total: q.total,
    daysWaiting: Math.floor((now.getTime() - q.updatedAt.getTime()) / DAY_MS),
  }));

  // Las cifras de dinero (facturado, por cobrar, vencido) solo se envían a owner/admin,
  // igual que la ruta de cuentas por cobrar.
  let finance = null;
  if (fullAccess) {
    const [monthAgg, prevMonthAgg, openInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { in: BILLED_STATUSES }, issueDate: { gte: monthStart } },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { in: BILLED_STATUSES }, issueDate: { gte: prevMonthStart, lt: monthStart } },
      }),
      prisma.invoice.findMany({
        where: { status: { in: OPEN_INVOICE_STATUSES } },
        include: { client: true },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const overdue = openInvoices
      .filter((inv) => inv.dueDate && inv.dueDate.getTime() < now.getTime())
      .map((inv) => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.client.name,
        balance: Math.round((inv.total - inv.amountPaid) * 100) / 100,
        daysLate: Math.floor((now.getTime() - (inv.dueDate as Date).getTime()) / DAY_MS),
      }));

    // Ganancia del mes: precio al cliente menos costo del proveedor de cada línea facturada.
    const monthItems = await prisma.invoiceItem.findMany({
      where: { invoice: { status: { in: BILLED_STATUSES }, issueDate: { gte: monthStart } } },
      select: { unitPrice: true, unitCost: true, quantity: true },
    });
    const monthCost = monthItems.reduce((sum, it) => sum + it.unitCost * it.quantity, 0);
    const monthSold = monthItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

    finance = {
      profitThisMonth: Math.round((monthSold - monthCost) * 100) / 100,
      marginThisMonth: monthSold > 0 ? Math.round(((monthSold - monthCost) / monthSold) * 100) : 0,
      invoicedThisMonth: monthAgg._sum.total || 0,
      invoicedLastMonth: prevMonthAgg._sum.total || 0,
      receivableTotal: openInvoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0),
      overdueTotal: overdue.reduce((sum, inv) => sum + inv.balance, 0),
      overdueInvoices: overdue.slice(0, 5),
    };
  }

  // Pasaportes que vencen en los próximos 6 meses de clientes con un viaje por delante.
  const passportLimit = new Date(now.getTime() + 180 * DAY_MS);
  const passportClients = await prisma.client.findMany({
    where: {
      passportExpiry: { not: null, lte: passportLimit },
      bookings: { some: { date: { gte: todayKey }, status: { not: 'cancelada' } } },
    },
    include: { bookings: { where: { date: { gte: todayKey }, status: { not: 'cancelada' } }, orderBy: { date: 'asc' }, take: 1 } },
    take: 5,
  });
  const passportAlerts = passportClients.map((c) => ({
    id: c.id,
    name: c.name,
    passportExpiry: c.passportExpiry,
    tripLabel: c.bookings[0]?.itemLabel ?? '',
    tripDate: c.bookings[0]?.date ?? null,
  }));

  return NextResponse.json({
    passportAlerts,
    clientCount,
    quoteCount,
    bookingCount,
    pendingQuoteCount,
    openQuoteTotal: quoteTotalAgg._sum.total || 0,
    recentBookings,
    bookingsByStatus,
    pendingQuotes,
    quoteTrend,
    acceptedQuoteRate: {
      accepted: acceptedQuoteCount,
      total: quoteCount,
      rate: quoteCount > 0 ? Math.round((acceptedQuoteCount / quoteCount) * 100) : 0,
    },
    upcomingBookings,
    acceptedNotInvoiced,
    staleQuotes,
    finance,
  });
}
