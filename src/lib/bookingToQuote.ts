import { createQuoteWithNextNumber } from './quoteNumbering';
import { isUniqueConstraintOnField } from './prismaErrors';

export const AUTO_QUOTE_NOTE = 'Generada automáticamente desde una solicitud de cotización en la web.';
export const MANUAL_CONVERT_NOTE = 'Generada desde el panel admin al convertir una reserva en cotización.';

/**
 * Crea una Quote en borrador a partir de una reserva (booking), vinculada
 * a `bookingId` de forma única: si ya existía una cotización para esa
 * reserva (doble clic, carrera), devuelve null en lugar de duplicarla.
 */
export async function createQuoteFromBooking(bookingId: string, clientId: string, itemLabel: string, total: number, note: string = AUTO_QUOTE_NOTE) {
  try {
    return await createQuoteWithNextNumber({
      clientId,
      bookingId,
      notes: note,
      total,
      status: 'borrador',
      items: {
        create: [{ description: itemLabel, unitPrice: total, quantity: 1, subtotal: total }],
      },
    });
  } catch (err) {
    if (isUniqueConstraintOnField(err, 'bookingId')) {
      return null;
    }
    throw err;
  }
}
