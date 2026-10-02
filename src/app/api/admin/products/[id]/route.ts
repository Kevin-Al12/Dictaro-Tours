import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintError } from '@/lib/prismaErrors';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { code, description, price, category } = body;

  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { code, description, price: parseFloat(price), category },
    });
    return NextResponse.json({ product });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: 'Ya existe un producto con ese código' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar el producto' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar el producto' }, { status: 400 });
  }
}
