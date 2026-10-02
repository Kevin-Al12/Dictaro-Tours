// Crea o actualiza una cuenta de administrador (tabla AdminUser).
// Uso:
//   node scripts/create-admin.mjs correo@ejemplo.com "ContraseñaFuerte123!" "Nombre Completo" [rol]
//
// Ejecutar después de: npx prisma generate && npx prisma db push

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const [, , email, password, name, role] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/create-admin.mjs correo@ejemplo.com "contraseña" "Nombre" [rol]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash, name: name || email, ...(role ? { role } : {}) },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || email,
      role: role || 'owner',
    },
  });
  console.log(`Listo — cuenta admin creada/actualizada: ${admin.email} (rol: ${admin.role})`);
} finally {
  await prisma.$disconnect();
}
