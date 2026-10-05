import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintError } from '@/lib/prismaErrors';

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, description, price, cost, category } = body;

  if (!code || !description || price === undefined || !category) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: { code, description, price: parseFloat(price), cost: parseFloat(cost) || 0, category },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: 'Ya existe un producto con ese código' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo crear el producto' }, { status: 500 });
  }
}
