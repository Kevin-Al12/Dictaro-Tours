import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { name: true, email: true, role: true },
  });

  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({ admin });
}
