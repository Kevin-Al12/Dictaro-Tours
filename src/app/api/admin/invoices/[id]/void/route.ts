import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const { voidReason } = await req.json();
  if (!voidReason || !String(voidReason).trim()) {
    return NextResponse.json({ error: 'Debes indicar el motivo de anulación' }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  if (invoice.status === 'anulada') {
    return NextResponse.json({ error: 'Esta factura ya está anulada' }, { status: 400 });
  }

  // Si en el futuro esto ya emitió un e-CF real ante la DGII, anular aquí también debería
  // disparar una nota de crédito electrónica, no solo cambiar el estado local. Por ahora
  // la factura no es un e-CF válido (ver nota en /emit), así que anular localmente basta.
  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: { status: 'anulada', voidReason: String(voidReason).trim(), voidedAt: new Date() },
    include: { client: { select: { name: true } } },
  });
  await logAudit(req, 'factura.anulada', `anuló la factura ${invoice.number ? `FAC-${String(invoice.number).padStart(4, '0')}` : 'en borrador'} de ${updated.client.name} (${String(voidReason).trim()})`);

  return NextResponse.json({ invoice: updated });
}
