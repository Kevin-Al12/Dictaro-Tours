import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createQuoteWithNextNumber } from '@/lib/quoteNumbering';
import { isUniqueConstraintOnField } from '@/lib/prismaErrors';

export async function GET() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: true, items: true },
  });
  return NextResponse.json({ quotes });
}

interface QuoteItemInput {
  productId?: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

interface PreparedItem {
  productId: string | null;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, notes, items } = body as { clientId: string; notes?: string; items: QuoteItemInput[] };

  if (!clientId || !items || items.length === 0) {
    return NextResponse.json({ error: 'Selecciona un cliente y al menos un producto' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const preparedItems: PreparedItem[] = items.map((it) => ({
    productId: it.productId || null,
    description: it.description,
    unitPrice: parseFloat(String(it.unitPrice)),
    quantity: parseInt(String(it.quantity), 10) || 1,
    subtotal: parseFloat(String(it.unitPrice)) * (parseInt(String(it.quantity), 10) || 1),
  }));
  const total = preparedItems.reduce((sum, it) => sum + it.subtotal, 0);

  try {
    const quote = await createQuoteWithNextNumber({ clientId, notes, total, items: { create: preparedItems } });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintOnField(err, 'number')) {
      return NextResponse.json(
        { error: 'No se pudo asignar un número de cotización por una colisión. Intenta de nuevo.' },
        { status: 409 }
      );
    }
    throw err;
  }
}
