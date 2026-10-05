import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Marca el voucher de una reserva como enviado al cliente.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  if (!['confirmada', 'completada'].includes(booking.status)) {
    return NextResponse.json({ error: 'Solo las reservas confirmadas tienen voucher' }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { voucherSentAt: new Date() },
  });
  await logAudit(req, 'voucher.enviado', `envió el voucher de ${booking.itemLabel} a ${booking.customerName}`);

  return NextResponse.json({ sentAt: updated.voucherSentAt });
}
