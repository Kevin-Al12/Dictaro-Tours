import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { formatPrice } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { client: true, items: true },
  });
  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
  return NextResponse.json({ quote });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  const validStatuses = ['borrador', 'enviada', 'aceptada', 'vencida'];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: { status },
      include: { client: true, items: true },
    });
    if (status === 'aceptada') {
      await logAudit(req, 'cotizacion.aceptada', `marcó como aceptada la cotización COT-${String(quote.number).padStart(4, '0')} de ${quote.client.name} por ${formatPrice(quote.total)}`);
    }
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar la cotización' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.quote.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar la cotización' }, { status: 400 });
  }
}
