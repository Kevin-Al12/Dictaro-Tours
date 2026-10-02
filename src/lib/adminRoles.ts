import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from './adminAuth';
import { type AdminRole, FULL_ACCESS_ROLES } from './adminRoleConstants';

export { type AdminRole, FULL_ACCESS_ROLES };

export async function getAdminSession(req: NextRequest) {
  return verifyAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

type RequireRoleResult =
  | { ok: true; session: { adminId: string; role: string } }
  | { ok: false; response: NextResponse };

/**
 * Verifica sesión + rol del lado servidor. Cada ruta API sensible (anular facturas,
 * cuentas por cobrar, configuración de empresa) debe llamar esto — ocultar el botón
 * en el UI no es suficiente.
 */
export async function requireRole(req: NextRequest, allowed: AdminRole[]): Promise<RequireRoleResult> {
  const session = await getAdminSession(req);
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  if (!allowed.includes(session.role as AdminRole)) {
    return { ok: false, response: NextResponse.json({ error: 'No tienes permiso para esta acción' }, { status: 403 }) };
  }
  return { ok: true, session };
}
