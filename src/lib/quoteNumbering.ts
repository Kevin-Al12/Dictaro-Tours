import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { isUniqueConstraintOnField } from './prismaErrors';

/**
 * Crea una Quote asignándole el siguiente número consecutivo dentro de una
 * transacción. Si dos creaciones simultáneas chocan contra el @unique de
 * `number`, reintenta con un conteo fresco. Cualquier otro choque de
 * unicidad (p. ej. `bookingId`) se propaga tal cual para que el llamador
 * decida qué hacer.
 */
export async function createQuoteWithNextNumber(data: Omit<Prisma.QuoteUncheckedCreateInput, 'number'>) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const count = await tx.quote.count();
        return tx.quote.create({
          data: { ...data, number: count + 1 },
          include: { client: true, items: true },
        });
      });
    } catch (err) {
      if (isUniqueConstraintOnField(err, 'number') && attempt < MAX_ATTEMPTS) continue;
      throw err;
    }
  }
  throw new Error('No se pudo asignar un número de cotización tras varios intentos');
}
