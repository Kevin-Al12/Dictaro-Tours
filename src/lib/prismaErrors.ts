import { Prisma } from '@prisma/client';

export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export function isUniqueConstraintOnField(err: unknown, field: string): boolean {
  if (!isUniqueConstraintError(err)) return false;
  const target = (err as Prisma.PrismaClientKnownRequestError).meta?.target;
  return Array.isArray(target) && target.includes(field);
}
