import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, createAdminSession } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña son requeridos' }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: String(email).toLowerCase().trim() },
  });

  // Mismo mensaje de error exista o no la cuenta, para no revelar qué correos son válidos.
  if (!admin) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const { token, maxAge } = await createAdminSession(admin.id, admin.role);

  const res = NextResponse.json({ success: true, name: admin.name });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
  return res;
}
