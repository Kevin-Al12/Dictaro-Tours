# Requisitos: FacturaciÃ³n y panel de administraciÃ³n â€” Ditaros Tours

Basado en: (1) revisiÃ³n del sistema de facturaciÃ³n actual que usa tu tÃ­a (D.AlcÃ¡ntara â€” mÃ³dulo "D Tours" de una plataforma multi-negocio), (2) el cÃ³digo ya existente en `ditaros-tours` (Next.js 14 + Prisma/SQLite), y (3) la normativa vigente de la DGII sobre facturaciÃ³n electrÃ³nica en RepÃºblica Dominicana (agosto 2026).

---

## 0. Alerta regulatoria â€” lÃ©ela antes de construir nada

La DGII hizo obligatoria la **factura electrÃ³nica (e-CF)** por fases. SegÃºn el calendario vigente:

- Grandes contribuyentes nacionales: obligatorio desde mayo 2024.
- Grandes locales y medianos: **obligatorio desde el 1 de noviembre de 2026** (los NCF tipo "B" en papel dejan de ser vÃ¡lidos despuÃ©s del 31 de octubre de 2026, salvo contingencia declarada).
- PequeÃ±os, micro y no clasificados: **obligatorio desde el 15 de noviembre de 2026** (prÃ³rroga automÃ¡tica otorgada el 6 de mayo de 2026).

Esto le aplica al negocio de tu tÃ­a casi seguro (es pequeÃ±o/mediano contribuyente). El sistema actual que usa ("AdministraciÃ³n de NCF" con secuencias tipo B01/B02 en papel) **queda obsoleto en menos de 3 meses**. Esto cambia la prioridad del proyecto: no tiene sentido invertir tiempo en replicar un mÃ³dulo de NCF tradicional si va a dejar de ser vÃ¡lido.

**Requisitos para operar en e-CF:** RNC activo, certificado digital (de una entidad autorizada por INDOTEL), software de facturaciÃ³n "homologado" ante la DGII, acceso a la Oficina Virtual (OFV), y pasar por 3 etapas (solicitud en OFV, pruebas tÃ©cnicas, declaraciÃ³n jurada).

**DecisiÃ³n que hay que tomar ya (antes de programar el mÃ³dulo):** construir la emisiÃ³n de e-CF desde cero (generar XML, firmarlo digitalmente, enviarlo a la DGII, manejar respuestas/rechazos) es un proyecto de cumplimiento serio, no una pantalla mÃ¡s. Lo normal para un negocio de este tamaÃ±o es **integrarse vÃ­a API con un proveedor de e-CF ya certificado** (ej. servicios dominicanos de facturaciÃ³n electrÃ³nica) en vez de reinventar el envÃ­o a la DGII. Recomiendo definir esto con tu tÃ­a (Â¿ya tiene o va a tramitar un proveedor de e-CF?) antes de empezar a construir la parte de "facturaciÃ³n" â€” el diseÃ±o del modelo de datos cambia segÃºn la respuesta.

---

## 1. QuÃ© existe hoy en el proyecto (`ditaros-tours`)

Ya tienes una base sÃ³lida en el panel admin:

- **Productos** (`Product`): cÃ³digo, descripciÃ³n, precio, categorÃ­a.
- **Clientes** (`Client`): nombre, telÃ©fono, email, documento, notas.
- **Cotizaciones** (`Quote` + `QuoteItem`): borrador â†’ enviada â†’ aceptada â†’ vencida, con Ã­tems, total y notas.
- Login de admin con **una sola contraseÃ±a compartida** (`ADMIN_PASSWORD` en `.env`, sin usuarios ni roles).
- En la parte pÃºblica, un flujo de reserva con "pago" de tarjeta que es **una simulaciÃ³n** (`PaymentStep.tsx` dice literalmente "Pago demo Â· sin cargo real"), con la regla de negocio de depÃ³sito del 30% + resto antes del viaje.

Lo que **no existe todavÃ­a** y es justo lo que falta para "facturaciÃ³n y todo lo demÃ¡s": facturas reales, pagos/abonos, NCF/e-CF, reportes, reservaciones como entidad propia, vouchers, y roles de usuario.

---

## 2. Lo que hace el sistema actual de tu tÃ­a (referencia mÃ­nima a igualar)

Del sistema que revisamos, el mÃ³dulo de la agencia de viajes tiene esta estructura:

**Maestros:** Productos y Servicios, Clases (categorÃ­as), Clientes, AsesorÃ­as Migratorias, AdministraciÃ³n de Formularios, AdministraciÃ³n de Documentos, AdministraciÃ³n de NCF.

**Transacciones:** Reservaciones, FacturaciÃ³n, Cotizaciones, Entrada de Facturas, Cuentas por Cobrar, Recibos de Ingreso, Vouchers de Hotel, Re-Imprimir Facturas, Anular Facturas.

**Consultas:** Diario de Informes Auxiliares.

**Reportes:** Informes Generales.

El catÃ¡logo de productos mezcla habitaciones de hotel, excursiones, cambios de vuelo, cargos por maleta, trÃ¡mites migratorios (visa, ESTA, cita consular), es decir: todo se vende como una lÃ­nea de "producto" con cÃ³digo y precio fijo â€” igual a como ya lo modelaste en `Product`.

---

## 3. EspecificaciÃ³n funcional: mÃ³dulo de FacturaciÃ³n

### 3.1 Modelo de datos (nuevo, sobre el schema de Prisma actual)

```
Invoice
  id, number (secuencial interno), ncfType (o eCFType), ncfNumber (o eCF trackId),
  status: borrador | emitida | pagada_parcial | pagada | anulada
  issueDate, dueDate
  client -> Client
  quote -> Quote? (factura puede nacer de una cotizaciÃ³n aceptada)
  items -> InvoiceItem[]
  subtotal, itbis, total
  amountPaid (calculado o cacheado), balanceDue
  currency (DOP/USD si tu tÃ­a cotiza en dÃ³lares)
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

1. **CotizaciÃ³n â†’ Factura**: botÃ³n "Convertir a factura" en `QuotesPanel` cuando una cotizaciÃ³n estÃ¡ "aceptada" â€” copia los Ã­tems, no obliga a re-teclear nada.
2. **Emitir factura**: genera nÃºmero/NCF o e-CF segÃºn lo que se decida en la secciÃ³n 0. Debe quedar bloqueada para ediciÃ³n de montos una vez emitida (solo se corrige por nota de crÃ©dito o anulaciÃ³n, no editando).
3. **Registrar pago/abono** (Recibos de Ingreso): una factura puede recibir varios pagos parciales hasta saldarse â€” esto es clave porque el negocio ya trabaja con depÃ³sito 30% + resto despuÃ©s.
4. **Anular factura**: con motivo obligatorio, sin borrar el registro (auditorÃ­a). Si ya migraron a e-CF, esto implica enviar una nota de crÃ©dito electrÃ³nica, no solo cambiar un estado local.
5. **Reimprimir / reenviar factura**: PDF descargable y reenvÃ­o por email al cliente.
6. **Cuentas por cobrar**: vista de facturas con saldo pendiente, por cliente y por antigÃ¼edad (30/60/90 dÃ­as).

### 3.3 Reportes mÃ­nimos

- Ventas por perÃ­odo y por tipo de servicio (hotel, excursiÃ³n, trÃ¡mite migratorio, etc.).
- Cuentas por cobrar / envejecimiento de cartera.
- Cuadre de caja diario (ingresos por mÃ©todo de pago).
- Reporte de ITBIS cobrado (para la propia declaraciÃ³n de impuestos, aparte del envÃ­o del e-CF).

---

## 4. "Todo lo demÃ¡s" que debe tener el admin

- **Reservaciones** como entidad propia (no solo cotizaciÃ³n/factura): fechas de viaje, proveedor (hotel/aerolÃ­nea), estado (confirmada, en proceso, cancelada), para que no se pierda ese control operativo que sÃ­ tiene el sistema viejo.
- **Vouchers de hotel**: generaciÃ³n de PDF con los datos de la reserva para entregar al cliente â€” es un documento distinto a la factura.
- **Roles de usuario reales**: hoy es una sola contraseÃ±a para "admin". Como mÃ­nimo, separar DueÃ±o/Administrador (ve todo, incluida facturaciÃ³n y reportes) de Vendedor/Agente (crea cotizaciones y reservas, no anula facturas ni ve reportes financieros completos). Esto tambiÃ©n es requisito de auditorÃ­a para e-CF (saber quiÃ©n emitiÃ³/anulÃ³ quÃ©).
- **ConfiguraciÃ³n de la empresa**: RNC, direcciÃ³n fiscal, secuencias de NCF o credenciales/proveedor de e-CF, tasa de ITBIS, logo para las facturas/PDF.
- **Multi-moneda** si tu tÃ­a cotiza en USD ademÃ¡s de DOP (confirmar con ella).
- **BitÃ¡cora/auditorÃ­a** de acciones sensibles (quiÃ©n anulÃ³ una factura, quiÃ©n cambiÃ³ un precio).

---

## 5. PriorizaciÃ³n sugerida (dado el plazo del 15 de noviembre de 2026)

**Fase 1 â€” antes de la fecha lÃ­mite de la DGII:**
1. Definir con tu tÃ­a el proveedor de e-CF (o confirmar que ya tiene uno desde su sistema actual â€” puede que la empresa del sistema viejo ya se lo resuelva, vale la pena preguntarle directamente a ella o a su soporte tÃ©cnico).
2. Modelo de `Invoice`/`Payment` + flujo cotizaciÃ³nâ†’facturaâ†’pago, con la integraciÃ³n real o un simulador que ya deje el diseÃ±o listo para conectar el proveedor de e-CF.
3. Cuentas por cobrar y reporte de caja bÃ¡sico.
4. Roles de usuario (mÃ­nimo 2 niveles).

**Fase 2 â€” despuÃ©s, sin presiÃ³n de fecha:**
- Vouchers de hotel, reservaciones como entidad separada, reportes avanzados, multi-moneda, bitÃ¡cora de auditorÃ­a.

---

## 6. Preguntas para resolver con tu tÃ­a antes de programar

1. Â¿El negocio estÃ¡ registrado como pequeÃ±o/mediano/micro contribuyente ante la DGII? (define la fecha lÃ­mite exacta que le aplica).
2. Â¿El sistema que usa hoy (el de la captura que enviaste) ya ofrece o va a ofrecer e-CF, o hay que buscar un proveedor aparte?
3. Â¿CuÃ¡ntas personas van a usar el panel admin y quÃ© deberÃ­a poder hacer cada una (dueÃ±a vs. empleados)?
4. Â¿Maneja precios en USD, DOP, o ambos?
5. Â¿QuÃ© tan crÃ­tico es migrar el histÃ³rico de facturas/clientes del sistema viejo, o el nuevo panel arranca "en cero"?

---

*Fuentes sobre e-CF: [Alegra RD](https://blog.alegra.com/republica-dominicana/obligatoriedad-de-factura-electronica/)*
