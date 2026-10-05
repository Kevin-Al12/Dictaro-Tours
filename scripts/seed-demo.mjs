// Carga datos de ejemplo (clientes, reservas, cotizaciones y facturas) para ver el panel con vida.
// Uso:
//   node scripts/seed-demo.mjs
//
// Solo para pruebas locales: no lo corras contra la base de datos real de la agencia.
// Si ya se cargaron antes (detecta los correos @ejemplo.do), no hace nada.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DAY = 86_400_000;

function daysFromNow(n) {
  return new Date(Date.now() + n * DAY);
}

function dayKey(n) {
  const d = daysFromNow(n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CLIENTS = [
  { name: 'María Rodríguez', phone: '809-555-0101', email: 'maria@ejemplo.do' },
  { name: 'José Martínez', phone: '829-555-0102', email: 'jose@ejemplo.do' },
  { name: 'Ana Pérez', phone: '849-555-0103', email: 'ana@ejemplo.do' },
  { name: 'Carlos Gómez', phone: '809-555-0104', email: 'carlos@ejemplo.do' },
  { name: 'Laura Fernández', phone: '829-555-0105', email: 'laura@ejemplo.do' },
];

try {
  const already = await prisma.client.count({ where: { email: { endsWith: '@ejemplo.do' } } });
  if (already > 0) {
    console.log('Los datos de ejemplo ya estaban cargados. No se cambió nada.');
    process.exit(0);
  }

  const clients = [];
  for (const c of CLIENTS) clients.push(await prisma.client.create({ data: c }));
  const [maria, jose, ana, carlos, laura] = clients;

  const bookings = [
    { c: maria, itemLabel: 'Punta Cana todo incluido', date: dayKey(2), passengers: 2, total: 68000, status: 'confirmada' },
    { c: jose, itemLabel: 'Excursión Isla Saona', date: dayKey(5), passengers: 4, total: 22000, status: 'pendiente' },
    { c: ana, itemLabel: 'Madrid y Barcelona 8 días', date: dayKey(11), passengers: 2, total: 245000, status: 'confirmada' },
    { c: laura, itemLabel: 'Samaná fin de semana', date: dayKey(-6), passengers: 3, total: 31500, status: 'completada' },
  ];
  for (const b of bookings) {
    await prisma.booking.create({
      data: {
        type: 'booking', itemType: 'destino', itemLabel: b.itemLabel, date: b.date,
        passengers: b.passengers, total: b.total, status: b.status,
        customerName: b.c.name, customerEmail: b.c.email, customerPhone: b.c.phone, clientId: b.c.id,
      },
    });
  }

  const lastQuote = await prisma.quote.findFirst({ orderBy: { number: 'desc' }, select: { number: true } });
  let quoteNo = (lastQuote?.number ?? 0) + 1;
  const quotes = [
    { c: carlos, desc: 'Cancún 5 noches', total: 96000, status: 'enviada', ageDays: 8 },
    { c: maria, desc: 'Crucero por el Caribe', total: 152000, status: 'enviada', ageDays: 1 },
    { c: jose, desc: 'Boletos Santo Domingo - Miami', total: 38500, status: 'borrador', ageDays: 0 },
    { c: ana, desc: 'Seguro de viaje Europa', total: 9800, status: 'aceptada', ageDays: 3 },
    { c: laura, desc: 'Jarabacoa aventura', total: 18000, status: 'vencida', ageDays: 10 },
  ];
  for (const q of quotes) {
    const when = daysFromNow(-q.ageDays);
    await prisma.quote.create({
      data: {
        number: quoteNo++, status: q.status, total: q.total, clientId: q.c.id, createdAt: when, updatedAt: when,
        items: { create: [{ description: q.desc, unitPrice: q.total, quantity: 1, subtotal: q.total }] },
      },
    });
  }

  const lastInvoice = await prisma.invoice.findFirst({ where: { number: { not: null } }, orderBy: { number: 'desc' }, select: { number: true } });
  let invoiceNo = (lastInvoice?.number ?? 0) + 1;
  const invoices = [
    { c: laura, desc: 'Samaná fin de semana', total: 31500, paid: 31500, status: 'pagada', issued: -12, due: -2 },
    { c: maria, desc: 'Punta Cana todo incluido', total: 68000, paid: 30000, status: 'pagada_parcial', issued: -20, due: -5 },
    { c: ana, desc: 'Madrid y Barcelona 8 días', total: 245000, paid: 0, status: 'emitida', issued: -2, due: 9 },
    { c: carlos, desc: 'Boletos Punta Cana - Nueva York', total: 42000, paid: 42000, status: 'pagada', issued: -40, due: -30 },
  ];
  for (const inv of invoices) {
    const created = await prisma.invoice.create({
      data: {
        number: invoiceNo++, status: inv.status, clientId: inv.c.id,
        issueDate: daysFromNow(inv.issued), dueDate: daysFromNow(inv.due),
        subtotal: inv.total, total: inv.total, amountPaid: inv.paid,
        items: { create: [{ description: inv.desc, unitPrice: inv.total, quantity: 1, subtotal: inv.total }] },
      },
    });
    if (inv.paid > 0) {
      await prisma.payment.create({
        data: { invoiceId: created.id, amount: inv.paid, method: 'transferencia', receivedAt: daysFromNow(inv.issued + 1) },
      });
    }
  }

  console.log('Listo — datos de ejemplo cargados: 5 clientes, 4 reservas, 5 cotizaciones y 4 facturas.');
} finally {
  await prisma.$disconnect();
}
