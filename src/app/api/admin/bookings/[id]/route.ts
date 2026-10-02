import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['pendiente', 'confirmada', 'cancelada', 'completada'];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar la reserva' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.booking.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar la reserva' }, { status: 400 });
  }
}
