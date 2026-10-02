import { prisma } from './prisma';
import { isUniqueConstraintOnField } from './prismaErrors';

interface LinkInput {
  name: string;
  email?: string | null;
  phone?: string | null;
}

/**
 * Busca un Client existente por correo (o por teléfono si el correo no
 * coincide) y devuelve su id; si no existe, lo crea. Usado tanto por el
 * formulario público de reservas como por la conversión manual de una
 * reserva a cotización desde el admin, para que nunca quede una reserva
 * sin cliente vinculado.
 */
export async function findOrCreateClient({ name, email, phone }: LinkInput): Promise<string> {
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const normalizedPhone = phone?.trim() || null;

  if (normalizedEmail) {
    const byEmail = await prisma.client.findUnique({ where: { email: normalizedEmail } });
    if (byEmail) {
      if (!byEmail.phone && normalizedPhone) {
        await prisma.client.update({ where: { id: byEmail.id }, data: { phone: normalizedPhone } });
      }
      return byEmail.id;
    }
  }

  if (normalizedPhone) {
    const byPhone = await prisma.client.findFirst({ where: { phone: normalizedPhone } });
    if (byPhone) {
      if (!byPhone.email && normalizedEmail) {
        try {
          await prisma.client.update({ where: { id: byPhone.id }, data: { email: normalizedEmail } });
        } catch (err) {
          if (!isUniqueConstraintOnField(err, 'email')) throw err;
          // Carrera: otro cliente ya tomó ese correo entre la búsqueda y esta actualización. Ignoramos y seguimos con el match por teléfono.
        }
      }
      return byPhone.id;
    }
  }

  try {
    const created = await prisma.client.create({
      data: { name, email: normalizedEmail, phone: normalizedPhone },
    });
    return created.id;
  } catch (err) {
    if (isUniqueConstraintOnField(err, 'email') && normalizedEmail) {
      // Carrera: otra petición casi simultánea creó un cliente con este mismo correo.
      const existing = await prisma.client.findUnique({ where: { email: normalizedEmail } });
      if (existing) return existing.id;
    }
    throw err;
  }
}
