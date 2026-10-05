import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createQuoteWithNextNumber } from '@/lib/quoteNumbering';
import { isUniqueConstraintOnField } from '@/lib/prismaErrors';
import { logAudit } from '@/lib/audit';
import { formatPrice } from '@/lib/utils';

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
  unitCost?: number;
  quantity: number;
}

interface PreparedItem {
  productId: string | null;
  description: string;
  unitPrice: number;
  unitCost: number;
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
    unitCost: parseFloat(String(it.unitCost ?? 0)) || 0,
    quantity: parseInt(String(it.quantity), 10) || 1,
    subtotal: parseFloat(String(it.unitPrice)) * (parseInt(String(it.quantity), 10) || 1),
  }));
  const total = preparedItems.reduce((sum, it) => sum + it.subtotal, 0);

  try {
    const quote = await createQuoteWithNextNumber({ clientId, notes, total, items: { create: preparedItems } });
    await logAudit(req, 'cotizacion.creada', `creó la cotización COT-${String(quote.number).padStart(4, '0')} para ${client.name} por ${formatPrice(total)}`);
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
