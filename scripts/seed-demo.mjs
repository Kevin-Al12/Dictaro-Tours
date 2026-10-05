// Carga datos de EJEMPLO para enseñar el sistema: clientes, destinos, productos con costo,
// reservas, cotizaciones, facturas, pagos, usuarios y bitácora.
//
// Uso:
//   node scripts/seed-demo.mjs           → carga los datos de ejemplo
//   node scripts/seed-demo.mjs --borrar  → borra solo los datos de ejemplo
//
// Todo lo que crea este script tiene un id que empieza por "demo-", así que se puede
// borrar sin tocar los datos reales. Las fechas se calculan a partir de hoy.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();
const DAY = 86_400_000;
const ITBIS = 0.18;

const daysFromNow = (n, hour = 10) => {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const dayKey = (n) => {
  const d = daysFromNow(n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const round = (n) => Math.round(n * 100) / 100;

async function borrar() {
  const demo = { startsWith: 'demo-' };
  await prisma.payment.deleteMany({ where: { id: demo } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: demo } });
  await prisma.invoice.deleteMany({ where: { id: demo } });
  await prisma.quoteItem.deleteMany({ where: { quoteId: demo } });
  await prisma.quote.deleteMany({ where: { id: demo } });
  await prisma.booking.deleteMany({ where: { id: demo } });
  await prisma.client.deleteMany({ where: { id: demo } });
  await prisma.product.deleteMany({ where: { id: demo } });
  await prisma.destination.deleteMany({ where: { id: demo } });
  await prisma.auditLog.deleteMany({ where: { id: demo } });
  await prisma.adminUser.deleteMany({ where: { id: demo } });
}

// ── Catálogo ──
const PRODUCTS = [
  ['demo-p01', 'EJ-H001', 'Barceló Bávaro Palace · noche todo incluido (doble)', 'Hotel', 11500, 9600],
  ['demo-p02', 'EJ-H002', 'Grand Bahía Príncipe Cayo Levantado · noche TI', 'Hotel', 9800, 8200],
  ['demo-p03', 'EJ-H003', 'Hyatt Ziva Cancún · noche TI (doble)', 'Hotel', 16900, 14100],
  ['demo-p04', 'EJ-P001', 'Paquete Madrid 7 noches (vuelo + hotel)', 'Paquete', 121500, 101200],
  ['demo-p05', 'EJ-P002', 'Paquete París 6 noches (vuelo + hotel)', 'Paquete', 138000, 116500],
  ['demo-p06', 'EJ-B001', 'Boleto SDQ–MIA ida y vuelta', 'Boleto', 24500, 21800],
  ['demo-p07', 'EJ-B002', 'Boleto SDQ–MAD ida y vuelta', 'Boleto', 58000, 52500],
  ['demo-p08', 'EJ-E001', 'Excursión Isla Saona (por persona)', 'Excursión', 5600, 4100],
  ['demo-p09', 'EJ-E002', 'Avistamiento de ballenas Samaná (por persona)', 'Excursión', 4800, 3500],
  ['demo-p10', 'EJ-T001', 'Traslado privado aeropuerto PUJ (ida y vuelta)', 'Traslado', 6500, 4500],
  ['demo-p11', 'EJ-S001', 'Cargo por servicio de la agencia', 'Servicio', 3500, 0],
  ['demo-p12', 'EJ-S002', 'Asesoría y cita consular (visa)', 'Servicio', 4500, 0],
  ['demo-p13', 'EJ-G001', 'Seguro de viaje internacional (por persona)', 'Seguro', 3200, 2400],
];
const P = Object.fromEntries(PRODUCTS.map(([id, code, description, category, price, cost]) => [id, { id, code, description, category, price, cost }]));

const IMG = (id) => `https://images.unsplash.com/${id}?w=1200&q=80`;
const DESTINATIONS = [
  ['demo-d01', 'punta-cana-todo-incluido', 'Punta Cana todo incluido', 'República Dominicana', 'América', 'photo-1507525428034-b723cf961d3e', 38500, 42000, '4 días / 3 noches', true, 'Más vendido', 18.58, -68.4],
  ['demo-d02', 'samana-ballenas', 'Samaná y ballenas jorobadas', 'República Dominicana', 'América', 'photo-1559827260-dc66d52bef19', 24900, null, '3 días / 2 noches', true, 'Temporada', 19.2, -69.33],
  ['demo-d03', 'isla-saona', 'Excursión Isla Saona', 'República Dominicana', 'América', 'photo-1544551763-46a013bb70d5', 5600, null, '1 día', false, null, 18.15, -68.7],
  ['demo-d04', 'cancun-riviera-maya', 'Cancún y Riviera Maya', 'México', 'América', 'photo-1552074284-5e88ef1aef18', 68900, 74500, '6 días / 5 noches', true, 'Oferta', 21.16, -86.85],
  ['demo-d05', 'paris-clasico', 'París clásico', 'Francia', 'Europa', 'photo-1502602898657-3e91760cbb34', 138000, null, '7 días / 6 noches', false, null, 48.86, 2.35],
  ['demo-d06', 'jarabacoa-aventura', 'Jarabacoa aventura', 'República Dominicana', 'América', 'photo-1506905925346-21bda4d32df4', 9800, null, '2 días / 1 noche', false, null, 19.12, -70.64],
];

// ── Clientes ──
const CLIENTS = [
  ['demo-c01', 'Familia Pérez Rosario', '809-555-0142', 'perez.rosario@ejemplo.do', '001-1234567-8', 'RD1234567', 520],
  ['demo-c02', 'Carolina Méndez', '829-555-0190', 'carolina.mendez@ejemplo.do', '402-2234511-3', 'RD7654321', 38],
  ['demo-c03', 'Grupo Colegio San Judas', '809-555-0177', 'admin@sanjudas.ejemplo.do', 'RNC 1-01-23456-7', null, null],
  ['demo-c04', 'José Almonte', '849-555-0123', 'jose.almonte@ejemplo.do', '031-0098765-4', 'RD5551234', 1180],
  ['demo-c05', 'Luisa Fernández', '809-555-0166', 'luisa.fernandez@ejemplo.do', '001-7654321-0', 'RD9988776', 610],
  ['demo-c06', 'Ana Rivas', '829-555-0101', 'ana.rivas@ejemplo.do', '402-1111111-1', 'RD3344556', 95],
  ['demo-c07', 'Pedro Gil', '809-555-0188', 'pedro.gil@ejemplo.do', '001-2222222-2', null, null],
  ['demo-c08', 'Familia Núñez', '849-555-0155', 'nunez@ejemplo.do', '031-3333333-3', 'RD1122334', 400],
  ['demo-c09', 'Ramona Castillo', '809-555-0133', 'ramona.castillo@ejemplo.do', '001-4444444-4', 'RD6677889', -12],
  ['demo-c10', 'Héctor Santana', '829-555-0177', 'hector.santana@ejemplo.do', '402-5555555-5', null, null],
];

async function cargar() {
  const owner = await prisma.adminUser.findFirst({ where: { role: 'owner' }, orderBy: { createdAt: 'asc' } });
  const unusable = await bcrypt.hash(randomBytes(24).toString('hex'), 10); // nadie puede entrar con estas cuentas de ejemplo
  const mariela = await prisma.adminUser.create({ data: { id: 'demo-u01', email: 'mariela@ejemplo.do', passwordHash: unusable, name: 'Mariela Santos', role: 'admin' } });
  const ramon = await prisma.adminUser.create({ data: { id: 'demo-u02', email: 'ramon@ejemplo.do', passwordHash: unusable, name: 'Ramón Castillo', role: 'vendedor' } });
  const sellers = [owner?.id ?? mariela.id, mariela.id, ramon.id];

  for (const p of PRODUCTS) {
    const [id, code, description, category, price, cost] = p;
    await prisma.product.create({ data: { id, code, description, category, price, cost } });
  }

  for (const d of DESTINATIONS) {
    const [id, slug, name, country, continent, img, price, originalPrice, duration, featured, tag, lat, lng] = d;
    await prisma.destination.create({
      data: {
        id, slug, name, country, continent, price, originalPrice, duration, featured, tag, lat, lng,
        image: IMG(img),
        gallery: [IMG(img)],
        shortDescription: `${name}: paquete de ejemplo para mostrar el sistema.`,
        description: `Paquete de ejemplo de D'Itaros Tours. ${name} con alojamiento, traslados y asistencia de la agencia.`,
        departureDates: [dayKey(15), dayKey(30), dayKey(45)],
        includes: ['Alojamiento', 'Traslados', 'Asistencia de la agencia'],
        excludes: ['Gastos personales'],
        highlights: ['Salidas garantizadas', 'Pago en cuotas'],
        rating: 4.7, reviews: 32, available: 12,
      },
    });
  }

  for (const [id, name, phone, email, document, passportNumber, passportDays] of CLIENTS) {
    await prisma.client.create({
      data: {
        id, name, phone, email, document, passportNumber,
        passportExpiry: passportDays === null ? null : daysFromNow(passportDays),
        createdAt: daysFromNow(-400 + Number(id.slice(-2)) * 20),
      },
    });
  }
  const C = Object.fromEntries(CLIENTS.map((c) => [c[0], { id: c[0], name: c[1], phone: c[2], email: c[3] }]));

  // ── Reservas ── [id, cliente, ítem, tipo, díasHastaViaje, pax, total, estado, proveedor, localizador, voucherEnviadoHaceDías]
  const BOOKINGS = [
    ['demo-b01', 'demo-c01', 'Barceló Bávaro Palace · Punta Cana', 'hotel', 2, 4, 117000, 'confirmada', 'Barceló Bávaro Palace', 'BRC-88213', 0],
    ['demo-b02', 'demo-c03', 'Samaná · Grand Bahía Príncipe Cayo Levantado', 'destino', 6, 38, 412000, 'confirmada', 'Grand Bahía Príncipe', 'GBP-55102', null],
    ['demo-b03', 'demo-c05', 'Cancún y Riviera Maya', 'destino', 12, 2, 137800, 'confirmada', 'Hyatt Ziva Cancún', 'HZC-30981', 2],
    ['demo-b04', 'demo-c06', 'París clásico', 'destino', 14, 2, 276000, 'pendiente', null, null, null],
    ['demo-b05', 'demo-c04', 'Excursión Isla Saona', 'excursion', 19, 4, 22400, 'confirmada', 'Seavis Tours', 'SAO-1102', null],
    ['demo-b06', 'demo-c08', 'Excursión Isla Saona', 'excursion', 3, 5, 28000, 'confirmada', 'Seavis Tours', 'SAO-1109', 1],
    ['demo-b07', 'demo-c07', 'Punta Cana todo incluido', 'destino', 24, 4, 154000, 'pendiente', null, null, null],
    ['demo-b08', 'demo-c02', 'Paquete Madrid 7 noches', 'destino', 60, 1, 121500, 'confirmada', 'Iberia / Hotel Catalonia', 'IB-7Q2XK', null],
    ['demo-b09', 'demo-c09', 'Jarabacoa aventura', 'destino', -9, 2, 19600, 'completada', 'Rancho Baiguate', 'RB-4410', 12],
    ['demo-b10', 'demo-c10', 'Samaná y ballenas jorobadas', 'destino', -2, 3, 74700, 'cancelada', null, null, null],
  ];
  for (const [id, cid, itemLabel, itemType, days, passengers, total, status, supplier, locator, voucherAgo] of BOOKINGS) {
    const c = C[cid];
    await prisma.booking.create({
      data: {
        id, type: 'booking', itemType, itemLabel, date: dayKey(days), passengers, total, status, supplier, locator,
        voucherSentAt: voucherAgo === null ? null : daysFromNow(-voucherAgo, 9),
        customerName: c.name, customerEmail: c.email, customerPhone: c.phone, clientId: c.id,
        createdAt: daysFromNow(Math.min(-3, days - 30)),
      },
    });
  }

  // ── Cotizaciones ── [id, cliente, estado, haceDías, ítems [producto, cantidad], reserva]
  const lastQuote = await prisma.quote.findFirst({ orderBy: { number: 'desc' }, select: { number: true } });
  let quoteNo = (lastQuote?.number ?? 0) + 1;
  const QUOTES = [
    ['demo-q01', 'demo-c01', 'aceptada', 18, [['demo-p01', 8], ['demo-p10', 1], ['demo-p11', 4]], 'demo-b01'],
    ['demo-q02', 'demo-c03', 'aceptada', 25, [['demo-p02', 38], ['demo-p09', 38]], 'demo-b02'],
    ['demo-q03', 'demo-c05', 'aceptada', 8, [['demo-p03', 8], ['demo-p11', 2]], 'demo-b03'],
    ['demo-q04', 'demo-c06', 'enviada', 1, [['demo-p05', 2]], 'demo-b04'],
    ['demo-q05', 'demo-c07', 'enviada', 0, [['demo-p01', 12], ['demo-p10', 1]], 'demo-b07'],
    ['demo-q06', 'demo-c03', 'enviada', 7, [['demo-p08', 38]], null],
    ['demo-q07', 'demo-c10', 'enviada', 9, [['demo-p06', 3], ['demo-p13', 3]], null],
    ['demo-q08', 'demo-c08', 'aceptada', 1, [['demo-p08', 5]], 'demo-b06'],
    ['demo-q09', 'demo-c02', 'aceptada', 40, [['demo-p04', 1]], 'demo-b08'],
    ['demo-q10', 'demo-c04', 'aceptada', 30, [['demo-p08', 4]], 'demo-b05'],
    ['demo-q11', 'demo-c09', 'borrador', 0, [['demo-p12', 2], ['demo-p13', 2]], null],
    ['demo-q12', 'demo-c10', 'vencida', 35, [['demo-p02', 6], ['demo-p09', 3]], null],
    ['demo-q13', 'demo-c06', 'aceptada', 2, [['demo-p07', 2], ['demo-p13', 2], ['demo-p11', 2]], null],
  ];
  for (const [id, cid, status, ago, items, bookingId] of QUOTES) {
    const lines = items.map(([pid, qty], i) => {
      const p = P[pid];
      return { id: `${id}-i${i}`, description: p.description, unitPrice: p.price, unitCost: p.cost, quantity: qty, subtotal: p.price * qty, productId: p.id };
    });
    const when = daysFromNow(-ago);
    await prisma.quote.create({
      data: {
        id, number: quoteNo++, status, clientId: cid, bookingId, createdAt: when, updatedAt: when,
        total: lines.reduce((s, l) => s + l.subtotal, 0),
        items: { create: lines },
      },
    });
  }

  // ── Facturas ── [id, cliente, cotización, estado, emitidaHaceDías, venceEnDías, ítems, pagos [monto, haceDías, método]]
  const lastInvoice = await prisma.invoice.findFirst({ where: { number: { not: null } }, orderBy: { number: 'desc' }, select: { number: true } });
  let invoiceNo = (lastInvoice?.number ?? 0) + 1;
  const INVOICES = [
    ['demo-f01', 'demo-c01', 'demo-q01', 'pagada_parcial', 11, 1, [['demo-p01', 8], ['demo-p10', 1], ['demo-p11', 4]], [[58500, 10, 'transferencia']]],
    ['demo-f02', 'demo-c03', 'demo-q02', 'pagada_parcial', 20, 4, [['demo-p02', 38], ['demo-p09', 38]], [[123600, 19, 'transferencia'], [76400, 5, 'cheque']]],
    ['demo-f03', 'demo-c05', 'demo-q03', 'emitida', 4, 8, [['demo-p03', 8], ['demo-p11', 2]], []],
    ['demo-f04', 'demo-c04', 'demo-q10', 'emitida', 26, -12, [['demo-p08', 4]], []],
    ['demo-f05', 'demo-c02', 'demo-q09', 'pagada', 38, -8, [['demo-p04', 1]], [[60750, 37, 'tarjeta'], [60750, 9, 'transferencia']]],
    ['demo-f06', 'demo-c09', null, 'pagada', 30, -15, [['demo-p11', 1], ['demo-p06', 2]], [[52500, 29, 'efectivo']]],
    ['demo-f07', 'demo-c08', 'demo-q08', 'emitida', 1, 2, [['demo-p08', 5]], []],
    ['demo-f08', 'demo-c06', null, 'pagada', 52, -40, [['demo-p12', 1], ['demo-p13', 2]], [[10900, 50, 'tarjeta']]],
    ['demo-f09', 'demo-c10', null, 'anulada', 33, -20, [['demo-p02', 6]], []],
    ['demo-f10', 'demo-c07', null, 'pagada', 64, -50, [['demo-p06', 4], ['demo-p11', 4]], [[112000, 60, 'transferencia']]],
    ['demo-f11', 'demo-c05', null, 'pagada', 75, -60, [['demo-p03', 4], ['demo-p13', 2]], [[74000, 70, 'tarjeta']]],
    ['demo-f12', 'demo-c01', null, 'emitida', 47, -33, [['demo-p09', 4], ['demo-p11', 1]], [[10000, 40, 'efectivo']]],
  ];
  for (const [n, [id, cid, quoteId, status, issuedAgo, dueIn, items, payments]] of INVOICES.entries()) {
    const lines = items.map(([pid, qty], i) => {
      const p = P[pid];
      const rate = p.category === 'Servicio' ? ITBIS : 0; // ITBIS solo sobre el servicio de la agencia (ejemplo)
      const gross = p.price * qty;
      return { id: `${id}-i${i}`, description: p.description, unitPrice: p.price, unitCost: p.cost, quantity: qty, itbisRate: rate, subtotal: round(rate ? gross / (1 + rate) : gross), productId: p.id, gross };
    });
    const total = lines.reduce((s, l) => s + l.gross, 0);
    const subtotal = round(lines.reduce((s, l) => s + l.subtotal, 0));
    const paid = payments.reduce((s, [a]) => s + a, 0);
    await prisma.invoice.create({
      data: {
        id, number: invoiceNo++, status, clientId: cid, quoteId,
        issueDate: daysFromNow(-issuedAgo), dueDate: daysFromNow(dueIn),
        subtotal, itbis: round(total - subtotal), total, amountPaid: paid,
        createdById: sellers[n % sellers.length],
        voidReason: status === 'anulada' ? 'El cliente canceló el viaje (ejemplo)' : null,
        voidedAt: status === 'anulada' ? daysFromNow(-issuedAgo + 3) : null,
        items: { create: lines.map(({ gross, ...l }) => l) },
      },
    });
    for (const [i, [amount, ago, method]] of payments.entries()) {
      await prisma.payment.create({
        data: { id: `${id}-pay${i}`, invoiceId: id, amount, method, reference: method === 'transferencia' ? `BHD-${4410 + i + n * 7}` : null, receivedAt: daysFromNow(-ago), receivedById: sellers[(n + i) % sellers.length] },
      });
    }
  }

  // ── Bitácora ──
  const LOG = [
    [0, 'Mariela Santos', 'pago.registrado', 'Registró un pago de RD$76,400 (cheque) a Grupo Colegio San Judas'],
    [0, 'Ramón Castillo', 'cotizacion.creada', 'Creó una cotización para Pedro Gil · Punta Cana todo incluido'],
    [1, owner?.name ?? 'Administradora', 'factura.emitida', 'Emitió la factura de la Familia Núñez · Excursión Isla Saona'],
    [2, 'Ramón Castillo', 'voucher.enviado', 'Envió el voucher del Hyatt Ziva Cancún a Luisa Fernández'],
    [4, owner?.name ?? 'Administradora', 'factura.emitida', 'Emitió la factura de Luisa Fernández · Cancún'],
    [9, 'Mariela Santos', 'pago.registrado', 'Registró un pago de RD$60,750 (transferencia) a Carolina Méndez'],
    [10, 'Mariela Santos', 'pago.registrado', 'Registró un pago de RD$58,500 (transferencia) a la Familia Pérez Rosario'],
    [18, 'Ramón Castillo', 'cotizacion.aceptada', 'La Familia Pérez Rosario aceptó su cotización · Barceló Bávaro'],
    [30, owner?.name ?? 'Administradora', 'factura.anulada', 'Anuló la factura de Héctor Santana · el cliente canceló el viaje'],
  ];
  for (const [i, [ago, actorName, action, detail]] of LOG.entries()) {
    await prisma.auditLog.create({ data: { id: `demo-l${String(i).padStart(2, '0')}`, createdAt: daysFromNow(-ago, 9 + (i % 8)), actorName, action, detail } });
  }
}

try {
  if (process.argv.includes('--borrar')) {
    await borrar();
    console.log('Listo — se borraron los datos de ejemplo. Tus datos reales siguen intactos.');
  } else {
    const already = await prisma.client.count({ where: { id: { startsWith: 'demo-' } } });
    if (already > 0) {
      console.log('Los datos de ejemplo ya estaban cargados. Para recargarlos: node scripts/seed-demo.mjs --borrar y luego otra vez sin --borrar.');
    } else {
      await cargar();
      console.log('Listo — datos de ejemplo cargados: 10 clientes, 6 destinos, 13 productos, 10 reservas, 13 cotizaciones, 12 facturas, 2 usuarios y la bitácora.');
    }
  }
} finally {
  await prisma.$disconnect();
}
