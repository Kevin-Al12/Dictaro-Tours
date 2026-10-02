import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { CLIENT_SESSION_COOKIE, createClientSession } from '@/lib/clientAuth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, correo y contraseña son requeridos' }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.client.findUnique({ where: { email: normalizedEmail } });

  let client;
  if (existing) {
    if (existing.passwordHash) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo. Inicia sesión.' }, { status: 409 });
    }
    // Ya tenía reservas como invitado con este correo: al registrarse, hereda ese historial.
    client = await prisma.client.update({
      where: { id: existing.id },
      data: { passwordHash, name: name || existing.name, phone: phone || existing.phone },
    });
  } else {
    client = await prisma.client.create({
      data: { name, email: normalizedEmail, phone: phone || null, passwordHash },
    });
  }

  const { token, maxAge } = await createClientSession(client.id);
  const res = NextResponse.json({ success: true, name: client.name }, { status: 201 });
  res.cookies.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
  return res;
}
