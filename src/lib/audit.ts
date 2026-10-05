import type { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { getAdminSession } from './adminRoles';

/**
 * Agrega una línea a la bitácora de cambios. Nunca debe romper la acción principal:
 * si falla el registro, se ignora el error.
 */
export async function logAudit(req: NextRequest, action: string, detail: string) {
  try {
    const session = await getAdminSession(req);
    const admin = session ? await prisma.adminUser.findUnique({ where: { id: session.adminId }, select: { name: true } }) : null;
    await prisma.auditLog.create({ data: { actorName: admin?.name ?? 'Sistema', action, detail } });
  } catch {
    // La bitácora es informativa; no bloquea la operación.
  }
}
