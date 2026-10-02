import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintOnField } from '@/lib/prismaErrors';

export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, document, notes } = body;

  if (!name) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const normalizedEmail = email?.trim().toLowerCase() || null;

  try {
    const client = await prisma.client.create({
      data: { name, phone: phone || null, email: normalizedEmail, document: document || null, notes: notes || null },
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintOnField(err, 'email')) {
      return NextResponse.json({ error: 'Ya existe un cliente con ese correo' }, { status: 409 });
    }
    throw err;
  }
}
