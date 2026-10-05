import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

// Bitácora de solo lectura: no hay rutas para editar ni borrar registros.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const entries = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ entries });
}
