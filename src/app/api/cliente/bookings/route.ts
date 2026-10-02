import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientSession } from '@/lib/clientAuth';

export async function GET(req: NextRequest) {
  const session = await getClientSession(req);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const [client, bookings, quotes] = await Promise.all([
    prisma.client.findUnique({
      where: { id: session.clientId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quote.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        invoice: { include: { payments: true } },
      },
    }),
  ]);

  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({ client, bookings, quotes });
}
