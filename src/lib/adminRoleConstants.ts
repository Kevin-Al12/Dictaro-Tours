// Constantes puras (sin dependencias de servidor), seguras de importar tanto en
// componentes cliente (para mostrar/ocultar UI) como en rutas API (para autorizar).
export type AdminRole = 'owner' | 'admin' | 'vendedor';

export const FULL_ACCESS_ROLES: AdminRole[] = ['owner', 'admin'];

export function hasFullAccess(role: string | undefined | null): boolean {
  return FULL_ACCESS_ROLES.includes(role as AdminRole);
}
