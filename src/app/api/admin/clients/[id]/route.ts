import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintOnField } from '@/lib/prismaErrors';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, phone, email, document, notes } = body;
  const normalizedEmail = email?.trim().toLowerCase() || null;

  try {
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { name, phone: phone || null, email: normalizedEmail, document: document || null, notes: notes || null },
    });
    return NextResponse.json({ client });
  } catch (err) {
    if (isUniqueConstraintOnField(err, 'email')) {
      return NextResponse.json({ error: 'Ya existe un cliente con ese correo' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar el cliente' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.client.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar el cliente (puede tener cotizaciones asociadas)' }, { status: 400 });
  }
}
