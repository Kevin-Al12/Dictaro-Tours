# Requisitos: Facturación y panel de administración — Ditaros Tours

Basado en: (1) revisión del sistema de facturación actual que usa tu tía (D.Alcántara — módulo "D Tours" de una plataforma multi-negocio), (2) el código ya existente en `ditaros-tours` (Next.js 14 + Prisma/SQLite), y (3) la normativa vigente de la DGII sobre facturación electrónica en República Dominicana (agosto 2026).

---

## 0. Alerta regulatoria — léela antes de construir nada

La DGII hizo obligatoria la **factura electrónica (e-CF)** por fases. Según el calendario vigente:

- Grandes contribuyentes nacionales: obligatorio desde mayo 2024.
- Grandes locales y medianos: **obligatorio desde el 1 de noviembre de 2026** (los NCF tipo "B" en papel dejan de ser válidos después del 31 de octubre de 2026, salvo contingencia declarada).
- Pequeños, micro y no clasificados: **obligatorio desde el 15 de noviembre de 2026** (prórroga automática otorgada el 6 de mayo de 2026).

Esto le aplica al negocio de tu tía casi seguro (es pequeño/mediano contribuyente). El sistema actual que usa ("Administración de NCF" con secuencias tipo B01/B02 en papel) **queda obsoleto en menos de 3 meses**. Esto cambia la prioridad del proyecto: no tiene sentido invertir tiempo en replicar un módulo de NCF tradicional si va a dejar de ser válido.

**Requisitos para operar en e-CF:** RNC activo, certificado digital (de una entidad autorizada por INDOTEL), software de facturación "homologado" ante la DGII, acceso a la Oficina Virtual (OFV), y pasar por 3 etapas (solicitud en OFV, pruebas técnicas, declaración jurada).

**Decisión que hay que tomar ya (antes de programar el módulo):** construir la emisión de e-CF desde cero (generar XML, firmarlo digitalmente, enviarlo a la DGII, manejar respuestas/rechazos) es un proyecto de cumplimiento serio, no una pantalla más. Lo normal para un negocio de este tamaño es **integrarse vía API con un proveedor de e-CF ya certificado** (ej. servicios dominicanos de facturación electrónica) en vez de reinventar el envío a la DGII. Recomiendo definir esto con tu tía (¿ya tiene o va a tramitar un proveedor de e-CF?) antes de empezar a construir la parte de "facturación" — el diseño del modelo de datos cambia según la respuesta.

---

## 1. Qué existe hoy en el proyecto (`ditaros-tours`)

Ya tienes una base sólida en el panel admin:

- **Productos** (`Product`): código, descripción, precio, categoría.
- **Clientes** (`Client`): nombre, teléfono, email, documento, notas.
- **Cotizaciones** (`Quote` + `QuoteItem`): borrador → enviada → aceptada → vencida, con ítems, total y notas.
- Login de admin con **una sola contraseña compartida** (`ADMIN_PASSWORD` en `.env`, sin usuarios ni roles).
- En la parte pública, un flujo de reserva con "pago" de tarjeta que es **una simulación** (`PaymentStep.tsx` dice literalmente "Pago demo · sin cargo real"), con la regla de negocio de depósito del 30% + resto antes del viaje.

Lo que **no existe todavía** y es justo lo que falta para "facturación y todo lo demás": facturas reales, pagos/abonos, NCF/e-CF, reportes, reservaciones como entidad propia, vouchers, y roles de usuario.

---

## 2. Lo que hace el sistema actual de tu tía (referencia mínima a igualar)

Del sistema que revisamos, el módulo de la agencia de viajes tiene esta estructura:

**Maestros:** Productos y Servicios, Clases (categorías), Clientes, Asesorías Migratorias, Administración de Formularios, Administración de Documentos, Administración de NCF.

**Transacciones:** Reservaciones, Facturación, Cotizaciones, Entrada de Facturas, Cuentas por Cobrar, Recibos de Ingreso, Vouchers de Hotel, Re-Imprimir Facturas, Anular Facturas.

**Consultas:** Diario de Informes Auxiliares.

**Reportes:** Informes Generales.

El catálogo de productos mezcla habitaciones de hotel, excursiones, cambios de vuelo, cargos por maleta, trámites migratorios (visa, ESTA, cita consular), es decir: todo se vende como una línea de "producto" con código y precio fijo — igual a como ya lo modelaste en `Product`.

---

## 3. Especificación funcional: módulo de Facturación

### 3.1 Modelo de datos (nuevo, sobre el schema de Prisma actual)

```
Invoice
  id, number (secuencial interno), ncfType (o eCFType), ncfNumber (o eCF trackId),
  status: borrador | emitida | pagada_parcial | pagada | anulada
  issueDate, dueDate
  client -> Client
  quote -> Quote? (factura puede nacer de una cotización aceptada)
  items -> InvoiceItem[]
  subtotal, itbis, total
  amountPaid (calculado o cacheado), balanceDue
  currency (DOP/USD si tu tía cotiza en dólares)
  notes
  voidReason, voidedAt (si se anula)

InvoiceItem
  description, unitPrice, quantity, subtotal, itbisRate
  product -> Product? (igual que QuoteItem)

Payment (Recibos de Ingreso / abonos)
  id, invoice -> Invoice, amount, method (efectivo, transferencia, tarjeta, cheque),
  reference, receivedAt, receivedBy (usuario admin)
```

### 3.2 Flujos obligatorios

1. **Cotización → Factura**: botón "Convertir a factura" en `QuotesPanel` cuando una cotización está "aceptada" — copia los ítems, no obliga a re-teclear nada.
2. **Emitir factura**: genera número/NCF o e-CF según lo que se decida en la sección 0. Debe quedar bloqueada para edición de montos una vez emitida (solo se corrige por nota de crédito o anulación, no editando).
3. **Registrar pago/abono** (Recibos de Ingreso): una factura puede recibir varios pagos parciales hasta saldarse — esto es clave porque el negocio ya trabaja con depósito 30% + resto después.
4. **Anular factura**: con motivo obligatorio, sin borrar el registro (auditoría). Si ya migraron a e-CF, esto implica enviar una nota de crédito electrónica, no solo cambiar un estado local.
5. **Reimprimir / reenviar factura**: PDF descargable y reenvío por email al cliente.
6. **Cuentas por cobrar**: vista de facturas con saldo pendiente, por cliente y por antigüedad (30/60/90 días).

### 3.3 Reportes mínimos

- Ventas por período y por tipo de servicio (hotel, excursión, trámite migratorio, etc.).
- Cuentas por cobrar / envejecimiento de cartera.
- Cuadre de caja diario (ingresos por método de pago).
- Reporte de ITBIS cobrado (para la propia declaración de impuestos, aparte del envío del e-CF).

---

## 4. "Todo lo demás" que debe tener el admin

- **Reservaciones** como entidad propia (no solo cotización/factura): fechas de viaje, proveedor (hotel/aerolínea), estado (confirmada, en proceso, cancelada), para que no se pierda ese control operativo que sí tiene el sistema viejo.
- **Vouchers de hotel**: generación de PDF con los datos de la reserva para entregar al cliente — es un documento distinto a la factura.
- **Roles de usuario reales**: hoy es una sola contraseña para "admin". Como mínimo, separar Dueño/Administrador (ve todo, incluida facturación y reportes) de Vendedor/Agente (crea cotizaciones y reservas, no anula facturas ni ve reportes financieros completos). Esto también es requisito de auditoría para e-CF (saber quién emitió/anuló qué).
- **Configuración de la empresa**: RNC, dirección fiscal, secuencias de NCF o credenciales/proveedor de e-CF, tasa de ITBIS, logo para las facturas/PDF.
- **Multi-moneda** si tu tía cotiza en USD además de DOP (confirmar con ella).
- **Bitácora/auditoría** de acciones sensibles (quién anuló una factura, quién cambió un precio).

---

## 5. Priorización sugerida (dado el plazo del 15 de noviembre de 2026)

**Fase 1 — antes de la fecha límite de la DGII:**
1. Definir con tu tía el proveedor de e-CF (o confirmar que ya tiene uno desde su sistema actual — puede que la empresa del sistema viejo ya se lo resuelva, vale la pena preguntarle directamente a ella o a su soporte técnico).
2. Modelo de `Invoice`/`Payment` + flujo cotización→factura→pago, con la integración real o un simulador que ya deje el diseño listo para conectar el proveedor de e-CF.
3. Cuentas por cobrar y reporte de caja básico.
4. Roles de usuario (mínimo 2 niveles).

**Fase 2 — después, sin presión de fecha:**
- Vouchers de hotel, reservaciones como entidad separada, reportes avanzados, multi-moneda, bitácora de auditoría.

---

## 6. Preguntas para resolver con tu tía antes de programar

1. ¿El negocio está registrado como pequeño/mediano/micro contribuyente ante la DGII? (define la fecha límite exacta que le aplica).
2. ¿El sistema que usa hoy (el de la captura que enviaste) ya ofrece o va a ofrecer e-CF, o hay que buscar un proveedor aparte?
3. ¿Cuántas personas van a usar el panel admin y qué debería poder hacer cada una (dueña vs. empleados)?
4. ¿Maneja precios en USD, DOP, o ambos?
5. ¿Qué tan crítico es migrar el histórico de facturas/clientes del sistema viejo, o el nuevo panel arranca "en cero"?

---

*Fuentes sobre e-CF: [Alegra RD](https://blog.alegra.com/republica-dominicana/obligatoriedad-de-factura-electronica/)*
