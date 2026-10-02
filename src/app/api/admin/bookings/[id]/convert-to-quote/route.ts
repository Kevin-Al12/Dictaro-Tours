import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateClient } from '@/lib/clientLink';
import { createQuoteFromBooking, MANUAL_CONVERT_NOTE } from '@/lib/bookingToQuote';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { quote: true } });
  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }
  if (booking.quote) {
    return NextResponse.json({ error: 'Esta reserva ya fue convertida a cotización' }, { status: 409 });
  }

  let clientId = booking.clientId;
  if (!clientId) {
    clientId = await findOrCreateClient({ name: booking.customerName, email: booking.customerEmail, phone: booking.customerPhone });
    await prisma.booking.update({ where: { id: booking.id }, data: { clientId } });
  }

  const quote = await createQuoteFromBooking(booking.id, clientId, booking.itemLabel, booking.total, MANUAL_CONVERT_NOTE);
  if (!quote) {
    return NextResponse.json({ error: 'Esta reserva ya fue convertida a cotización' }, { status: 409 });
  }
  return NextResponse.json({ quote }, { status: 201 });
}
