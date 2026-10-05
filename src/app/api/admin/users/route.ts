import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  // Nunca se devuelve passwordHash.
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({ users });
}
