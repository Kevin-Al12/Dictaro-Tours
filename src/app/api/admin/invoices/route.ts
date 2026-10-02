import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminRoles';
import { computeLineAmounts, sumLineAmounts } from '@/lib/invoiceMath';

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId');

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: { client: true, items: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ invoices });
}

interface InvoiceItemInput {
  productId?: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { clientId, notes, dueDate, items } = body as {
    clientId: string; notes?: string; dueDate?: string; items: InvoiceItemInput[];
  };

  if (!clientId || !items || items.length === 0) {
    return NextResponse.json({ error: 'Selecciona un cliente y al menos un producto' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  const itbisRate = settings?.itbisRate ?? 0.18;

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

  const invoice = await prisma.invoice.create({
    data: {
      status: 'borrador',
      currency: 'DOP',
      subtotal: totals.subtotal,
      itbis: totals.itbis,
      total: totals.total,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      clientId,
      createdById: session.adminId,
      items: {
        create: lineItems.map(({ _amounts, ...item }) => item),
      },
    },
    include: { items: true, client: true },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
