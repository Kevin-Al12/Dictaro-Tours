import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminRoles';
import { computeLineAmounts, sumLineAmounts } from '@/lib/invoiceMath';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { items: true, invoice: true },
  });
  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
  if (quote.status !== 'aceptada') {
    return NextResponse.json({ error: 'Solo se pueden convertir cotizaciones en estado "aceptada"' }, { status: 400 });
  }
  if (quote.invoice) {
    return NextResponse.json({ error: 'Esta cotización ya fue convertida a factura' }, { status: 409 });
  }

  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  const itbisRate = settings?.itbisRate ?? 0.18;

  const lineItems = quote.items.map((it) => {
    const amounts = computeLineAmounts(it.unitPrice, it.quantity, itbisRate);
    return {
      description: it.description,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      itbisRate,
      subtotal: amounts.subtotal,
      productId: it.productId,
      _amounts: amounts,
    };
  });
  const totals = sumLineAmounts(lineItems.map((l) => l._amounts));

  const invoice = await prisma.invoice.create({
    data: {
      status: 'borrador',
      currency: 'DOP',
      subtotal: totals.subtotal,
      itbis: totals.itbis,
      total: totals.total,
      clientId: quote.clientId,
      quoteId: quote.id,
      createdById: session.adminId,
      items: {
        create: lineItems.map(({ _amounts, ...item }) => item),
      },
    },
    include: { items: true, client: true },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
