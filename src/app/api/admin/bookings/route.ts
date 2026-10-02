import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { quote: { select: { id: true, number: true } } },
  });
  return NextResponse.json({ bookings });
}
