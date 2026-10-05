import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Los vouchers salen solos de las reservas confirmadas o completadas.
// El código V-0001 sigue el orden en que se crearon las reservas.
export async function GET() {
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ['confirmada', 'completada'] } },
    orderBy: { createdAt: 'asc' },
  });

  const vouchers = bookings
    .map((b, i) => ({
      id: b.id,
      code: `V-${String(i + 1).padStart(4, '0')}`,
      client: b.customerName,
      clientPhone: b.customerPhone,
      clientEmail: b.customerEmail,
      service: b.itemLabel,
      itemType: b.itemType,
      supplier: b.supplier,
      date: b.date,
      pax: b.passengers,
      locator: b.locator,
      status: b.status,
      sentAt: b.voucherSentAt,
      createdAt: b.createdAt,
    }))
    .reverse();

  return NextResponse.json({ vouchers });
}
