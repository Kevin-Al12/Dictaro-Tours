import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminRoles';
import { isUniqueConstraintError } from '@/lib/prismaErrors';
import { logAudit } from '@/lib/audit';
import { formatPrice } from '@/lib/utils';

class InvoiceEmitError extends Error {
  constructor(public code: 'NOT_FOUND' | 'INVALID_STATUS') {
    super(code);
  }
}

async function emitWithNextNumber(id: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id } });
    if (!invoice) throw new InvoiceEmitError('NOT_FOUND');
    if (invoice.status !== 'borrador') throw new InvoiceEmitError('INVALID_STATUS');

    const count = await tx.invoice.count({ where: { number: { not: null } } });

    // INTEGRACIÓN PENDIENTE: cuando se defina el proveedor de e-CF con la dueña, aquí se debe
    // llamar a su API para timbrar/firmar la factura y guardar el NCF/trackId real en
    // ncfType/ncfNumber. Por ahora la factura se marca "emitida" solo para control interno de
    // la agencia (numeración secuencial propia) — esto NO es un e-CF válido ante la DGII todavía.
    return tx.invoice.update({
      where: { id },
      data: { number: count + 1, status: 'emitida', issueDate: new Date() },
      include: { items: true, client: true, payments: true },
    });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const invoice = await emitWithNextNumber(params.id);
      await logAudit(req, 'factura.emitida', `emitió la factura FAC-${String(invoice.number).padStart(4, '0')} a ${invoice.client.name} por ${formatPrice(invoice.total)}`);
      return NextResponse.json({ invoice });
    } catch (err) {
      if (err instanceof InvoiceEmitError) {
        if (err.code === 'NOT_FOUND') {
          return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Solo se pueden emitir facturas en borrador' }, { status: 400 });
      }
      if (isUniqueConstraintError(err) && attempt < MAX_ATTEMPTS) continue;
      if (isUniqueConstraintError(err)) {
        return NextResponse.json(
          { error: 'No se pudo asignar un número de factura por una colisión. Intenta de nuevo.' },
          { status: 409 }
        );
      }
      throw err;
    }
  }

  return NextResponse.json({ error: 'No se pudo emitir la factura' }, { status: 500 });
}
