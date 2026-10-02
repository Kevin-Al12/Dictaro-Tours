import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

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
  ] = await Promise.all([
    prisma.client.count(),
    prisma.quote.count(),
    prisma.booking.count({ where: { type: 'booking' } }),
    prisma.quote.count({ where: { status: { in: ['borrador', 'enviada'] } } }),
    prisma.quote.aggregate({ _sum: { total: true } }),
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
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    quoteTrend.push({ date: d.toISOString().split('T')[0], count: 0, total: 0 });
  }
  for (const q of recentQuotesForTrend) {
    const key = q.createdAt.toISOString().split('T')[0];
    const bucket = quoteTrend.find((d) => d.date === key);
    if (bucket) {
      bucket.count += 1;
      bucket.total += q.total;
    }
  }

  return NextResponse.json({
    clientCount,
    quoteCount,
    bookingCount,
    pendingQuoteCount,
    quoteTotalSum: quoteTotalAgg._sum.total || 0,
    recentBookings,
    bookingsByStatus,
    pendingQuotes,
    quoteTrend,
    acceptedQuoteRate: {
      accepted: acceptedQuoteCount,
      total: quoteCount,
      rate: quoteCount > 0 ? Math.round((acceptedQuoteCount / quoteCount) * 100) : 0,
    },
  });
}
