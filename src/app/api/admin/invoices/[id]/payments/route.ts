import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminRoles';
import { logAudit } from '@/lib/audit';
import { formatPrice } from '@/lib/utils';

const PAYABLE_STATUSES = ['emitida', 'pagada_parcial'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { amount, method, reference, notes } = body;
  const parsedAmount = parseFloat(amount);

  if (!parsedAmount || parsedAmount <= 0 || !method) {
    return NextResponse.json({ error: 'Monto y método de pago son requeridos' }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  if (!PAYABLE_STATUSES.includes(invoice.status)) {
    return NextResponse.json({ error: 'Solo se pueden registrar pagos sobre facturas emitidas' }, { status: 400 });
  }

  const newAmountPaid = Math.round((invoice.amountPaid + parsedAmount) * 100) / 100;
  if (newAmountPaid > invoice.total + 0.01) {
    return NextResponse.json({ error: 'El pago excede el saldo pendiente de la factura' }, { status: 400 });
  }

  const [payment, updatedInvoice] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        amount: parsedAmount,
        method,
        reference: reference || null,
        notes: notes || null,
        invoiceId: invoice.id,
        receivedById: session.adminId,
      },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        status: newAmountPaid >= invoice.total - 0.01 ? 'pagada' : 'pagada_parcial',
      },
      include: { items: true, payments: { orderBy: { receivedAt: 'desc' } }, client: true },
    }),
  ]);

  await logAudit(req, 'pago.registrado', `registró un pago de ${formatPrice(parsedAmount)} de ${updatedInvoice.client.name}${invoice.number ? ` en FAC-${String(invoice.number).padStart(4, '0')}` : ''}`);
  return NextResponse.json({ payment, invoice: updatedInvoice }, { status: 201 });
}
