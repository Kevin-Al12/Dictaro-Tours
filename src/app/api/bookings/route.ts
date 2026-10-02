import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateClient } from '@/lib/clientLink';
import { createQuoteFromBooking } from '@/lib/bookingToQuote';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    type, itemType, itemLabel, date, passengers, total, notes,
    customerName, customerEmail, customerPhone,
  } = body;

  if (!itemLabel || !customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
  }

  const clientId = await findOrCreateClient({ name: customerName, email: customerEmail, phone: customerPhone });
  const bookingType = type === 'quote' ? 'quote' : 'booking';
  const parsedTotal = parseFloat(String(total)) || 0;

  const booking = await prisma.booking.create({
    data: {
      type: bookingType,
      itemType: itemType || 'destino',
      itemLabel,
      date: date || null,
      passengers: parseInt(String(passengers), 10) || 1,
      total: parsedTotal,
      notes: notes || null,
      customerName,
      customerEmail,
      customerPhone,
      clientId,
    },
  });

  if (bookingType === 'quote') {
    await createQuoteFromBooking(booking.id, clientId, itemLabel, parsedTotal);
  }

  return NextResponse.json({ booking }, { status: 201 });
}
