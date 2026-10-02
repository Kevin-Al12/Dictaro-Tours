import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { CLIENT_SESSION_COOKIE, createClientSession } from '@/lib/clientAuth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña son requeridos' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { email: String(email).toLowerCase().trim() } });

  // Mismo mensaje exista o no la cuenta / tenga o no contraseña, para no revelar qué correos están registrados.
  if (!client || !client.passwordHash) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, client.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const { token, maxAge } = await createClientSession(client.id);
  const res = NextResponse.json({ success: true, name: client.name });
  res.cookies.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
  return res;
}
