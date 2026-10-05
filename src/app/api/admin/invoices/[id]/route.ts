import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminRoles';
import { computeLineAmounts, sumLineAmounts } from '@/lib/invoiceMath';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true, items: true, payments: { orderBy: { receivedAt: 'desc' } },
      quote: { include: { booking: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

  return NextResponse.json({ invoice: { ...invoice, balanceDue: invoice.total - invoice.amountPaid } });
}

interface InvoiceItemInput {
  productId?: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const existing = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  if (existing.status !== 'borrador') {
    return NextResponse.json({ error: 'Solo se pueden editar facturas en borrador' }, { status: 400 });
  }

  const body = await req.json();
  const { clientId, notes, dueDate, items } = body as {
    clientId?: string; notes?: string; dueDate?: string; items?: InvoiceItemInput[];
  };

  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  const itbisRate = settings?.itbisRate ?? 0.18;

  let totalsUpdate = {};
  if (items && items.length > 0) {
    const lineItems = items.map((it) => {
      const unitPrice = parseFloat(String(it.unitPrice));
      const quantity = parseInt(String(it.quantity), 10) || 1;
      const amounts = computeLineAmounts(unitPrice, quantity, itbisRate);
      return {
        description: it.description,
        unitPrice,
        quantity,
        itbisRate,
        subtotal: amounts.subtotal,
        productId: it.productId || null,
        _amounts: amounts,
      };
    });
    const totals = sumLineAmounts(lineItems.map((l) => l._amounts));
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: params.id } });
    await prisma.invoiceItem.createMany({
      data: lineItems.map(({ _amounts, ...item }) => ({ ...item, invoiceId: params.id })),
    });
    totalsUpdate = { subtotal: totals.subtotal, itbis: totals.itbis, total: totals.total };
  }

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      ...(clientId ? { clientId } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...totalsUpdate,
    },
    include: { items: true, client: true },
  });

  return NextResponse.json({ invoice });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const existing = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  if (existing.status !== 'borrador') {
    return NextResponse.json({ error: 'Solo se pueden eliminar facturas en borrador' }, { status: 400 });
  }

  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
