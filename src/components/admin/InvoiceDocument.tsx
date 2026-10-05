'use client';

import { AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { formatPrice, formatDate, formatShortDate } from '@/lib/utils';
import { PageHeader, Pill, type Tone } from './ui';

export interface InvoiceDocumentData {
  id: string;
  number: number | null;
  status: string;
  ncfType?: string | null;
  ncfNumber?: string | null;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  itbis: number;
  total: number;
  amountPaid: number;
  notes: string | null;
  voidReason: string | null;
  voidedAt: string | null;
  client: { id: string; name: string; document?: string | null; email?: string | null; phone?: string | null };
  items: { id: string; description: string; unitPrice: number; quantity: number; subtotal: number }[];
  payments: { id: string; amount: number; method: string; reference: string | null; notes: string | null; receivedAt: string }[];
  quote?: {
    number: number;
    status: string;
    updatedAt: string;
    booking?: { supplier: string | null; locator: string | null; status: string; voucherSentAt: string | null; updatedAt: string; date: string | null } | null;
  } | null;
  createdBy?: { name: string } | null;
}

export interface CompanyInfo {
  legalName: string;
  rnc?: string | null;
  address?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador', emitida: 'Emitida', pagada_parcial: 'Pago parcial', pagada: 'Pagada', anulada: 'Anulada',
};
const STATUS_TONE: Record<string, Tone> = {
  borrador: 'mute', emitida: 'info', pagada_parcial: 'warn', pagada: 'ok', anulada: 'bad',
};

export function invoiceCode(inv: { number: number | null }) {
  return inv.number ? `FAC-${String(inv.number).padStart(4, '0')}` : 'Borrador';
}

type StepState = 'done' | 'now' | 'pending' | 'bad';
interface Step { state: StepState; title: string; detail?: string }

function buildSteps(inv: InvoiceDocumentData, balance: number): Step[] {
  const steps: Step[] = [];
  if (inv.quote) {
    const q = `COT-${String(inv.quote.number).padStart(4, '0')}`;
    steps.push({
      state: 'done',
      title: inv.quote.status === 'aceptada' || inv.quote.status === 'facturada' ? `Cotización ${q} aceptada` : `Cotización ${q}`,
      detail: formatShortDate(inv.quote.updatedAt),
    });
    const b = inv.quote.booking;
    if (b && (b.locator || b.status === 'confirmada' || b.status === 'completada')) {
      steps.push({
        state: 'done',
        title: `Reserva confirmada${b.locator ? ` · loc. ${b.locator}` : ''}`,
        detail: [formatShortDate(b.voucherSentAt && b.voucherSentAt < b.updatedAt ? b.voucherSentAt : b.updatedAt), b.supplier].filter(Boolean).join(' · '),
      });
    }
  }

  if (inv.status === 'borrador') {
    steps.push({ state: 'now', title: 'Factura en borrador', detail: 'Pendiente de emitir' });
    return steps;
  }

  steps.push({
    state: 'done',
    title: inv.ncfNumber ? `e-CF ${inv.ncfNumber} emitido` : `Factura ${invoiceCode(inv)} emitida`,
    detail: [formatShortDate(inv.issueDate), inv.createdBy?.name ? `por ${inv.createdBy.name}` : null].filter(Boolean).join(' · '),
  });

  const payments = [...inv.payments].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
  for (const p of payments) {
    steps.push({
      state: 'done',
      title: `Pago de ${formatPrice(p.amount)} · ${p.method}`,
      detail: [formatShortDate(p.receivedAt), p.reference].filter(Boolean).join(' · '),
    });
  }

  if (inv.status === 'anulada') {
    steps.push({
      state: 'bad',
      title: 'Factura anulada',
      detail: [inv.voidedAt ? formatShortDate(inv.voidedAt) : null, inv.voidReason].filter(Boolean).join(' · '),
    });
    return steps;
  }

  const voucherSent = inv.quote?.booking?.voucherSentAt;
  if (balance > 0) {
    steps.push({
      state: 'now',
      title: 'Saldo antes de la salida',
      detail: `${formatPrice(balance)} pendiente${inv.dueDate ? ` · vence ${formatShortDate(inv.dueDate)}` : ''}`,
    });
    steps.push({ state: 'pending', title: 'Voucher y documentos de viaje', detail: 'Se envían al saldar' });
  } else if (voucherSent) {
    steps.push({ state: 'done', title: 'Voucher y documentos de viaje', detail: `Enviados ${formatShortDate(voucherSent)}` });
  } else {
    steps.push({ state: 'pending', title: 'Voucher y documentos de viaje', detail: 'Listo para enviar' });
  }
  return steps;
}

export default function InvoiceDocument({ invoice, company, actions, onBack, children }: {
  invoice: InvoiceDocumentData;
  company: CompanyInfo | null;
  actions?: React.ReactNode;
  onBack: () => void;
  children?: React.ReactNode;
}) {
  const balance = invoice.status === 'anulada' ? 0 : Math.max(invoice.total - invoice.amountPaid, 0);
  const steps = buildSteps(invoice, balance);
  const companyName = company?.legalName || "D'Itaros Tours";
  const companyLine = [company?.rnc ? `RNC ${company.rnc}` : null, company?.address].filter(Boolean).join(' · ');
  const isDraft = invoice.status === 'borrador';
  const title = isDraft ? 'Borrador de factura' : `Factura ${invoice.ncfNumber || invoiceCode(invoice)}`;
  const subtitle = `${invoice.client.name} · ${isDraft ? 'creada' : 'emitida'} el ${formatDate(invoice.issueDate)}`;
  // Código de seguridad visible solo cuando hay un NCF real.
  const securityCode = invoice.ncfNumber ? invoice.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6) : null;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="print:hidden">
        <button type="button" onClick={onBack} className="admin-btn" data-size="sm">
          <ArrowLeft className="h-3.5 w-3.5" />Facturas
        </button>
      </div>

      <div className="print:hidden">
        <PageHeader
          title={<span className="flex flex-wrap items-center gap-2.5">{title}<Pill tone={STATUS_TONE[invoice.status] ?? 'mute'}>{STATUS_LABEL[invoice.status] ?? invoice.status}</Pill></span>}
          subtitle={subtitle}
          actions={actions}
        />
      </div>

      {children}

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          {/* Documento */}
          <section className="admin-card flex flex-col gap-[18px] p-5 sm:p-[26px]">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="admin-display grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] text-[20px] font-bold"
                  style={{ background: 'var(--a-brand)', color: '#fff' }}
                  aria-hidden="true"
                >
                  D&rsquo;
                </div>
                <div>
                  <h2 className="admin-display text-[22px] font-bold leading-tight" style={{ color: 'var(--a-fg)' }}>{companyName}</h2>
                  {companyLine && <small style={{ color: 'var(--a-muted)' }}>{companyLine}</small>}
                </div>
              </div>
              <div className="text-right text-[12.5px] leading-relaxed" style={{ color: 'var(--a-muted)' }}>
                {invoice.ncfNumber ? (
                  <>
                    {invoice.ncfType || 'Comprobante fiscal electrónico'}<br />
                    e-NCF <b className="admin-num font-mono text-[13px]" style={{ color: 'var(--a-fg)' }}>{invoice.ncfNumber}</b><br />
                  </>
                ) : (
                  <>
                    Factura de control interno<br />
                    N° <b className="admin-num font-mono text-[13px]" style={{ color: 'var(--a-fg)' }}>{invoiceCode(invoice)}</b><br />
                  </>
                )}
                Fecha {formatShortDate(invoice.issueDate)}
                {invoice.dueDate && <><br />Vence {formatShortDate(invoice.dueDate)}</>}
              </div>
            </div>

            {!invoice.ncfNumber && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--a-warn-soft)', color: 'var(--a-warn)' }}>
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Factura de control interno: todavía no es un comprobante fiscal (e-CF).</span>
              </div>
            )}

            <div className="text-[13px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--a-faint)' }}>Facturado a</span>
              <p className="mt-0.5 font-semibold" style={{ color: 'var(--a-fg)' }}>{invoice.client.name}</p>
              {(invoice.client.document || invoice.client.email || invoice.client.phone) && (
                <p className="admin-num" style={{ color: 'var(--a-muted)' }}>
                  {[invoice.client.document ? `Doc. ${invoice.client.document}` : null, invoice.client.phone, invoice.client.email].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--a-line)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="r">Cant.</th>
                    <th className="r">Precio</th>
                    <th className="r">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.description}</td>
                      <td className="r admin-num">{it.quantity}</td>
                      <td className="r admin-num nowrap">{formatPrice(it.unitPrice)}</td>
                      <td className="r admin-num nowrap">{formatPrice(it.unitPrice * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              {invoice.ncfNumber && securityCode && (
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-[74px] w-[74px] shrink-0 rounded-md opacity-85"
                    role="img"
                    aria-label="Código QR de la DGII"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, var(--a-fg) 0 4px, transparent 4px 9px), repeating-linear-gradient(0deg, var(--a-fg) 0 5px, transparent 5px 8px)',
                    }}
                  />
                  <small style={{ color: 'var(--a-muted)' }}>
                    Código de seguridad <span className="font-mono" style={{ color: 'var(--a-fg)' }}>{securityCode}</span><br />
                    Verificable en dgii.gov.do
                  </small>
                </div>
              )}
              <div className="admin-num ml-auto grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px] sm:w-[260px]">
                <span style={{ color: 'var(--a-muted)' }}>Subtotal</span><span className="text-right">{formatPrice(invoice.subtotal)}</span>
                <span style={{ color: 'var(--a-muted)' }}>ITBIS</span><span className="text-right">{formatPrice(invoice.itbis)}</span>
                <span className="col-span-2 mt-0.5" style={{ borderTop: '1px solid var(--a-line)' }} aria-hidden="true" />
                <span className="text-base font-bold">Total</span>
                <span className="text-right text-base font-bold">{formatPrice(invoice.total)}</span>
                <span style={{ color: 'var(--a-ok)' }}>Pagado</span><span className="text-right" style={{ color: 'var(--a-ok)' }}>{formatPrice(invoice.amountPaid)}</span>
                <span className="font-bold" style={{ color: balance > 0 ? (isOverdue(invoice) ? 'var(--a-bad)' : 'var(--a-warn)') : 'var(--a-muted)' }}>Saldo</span>
                <span className="text-right font-bold" style={{ color: balance > 0 ? (isOverdue(invoice) ? 'var(--a-bad)' : 'var(--a-warn)') : 'var(--a-muted)' }}>{formatPrice(balance)}</span>
              </div>
            </div>

            {invoice.notes && <p className="text-[13px] italic" style={{ color: 'var(--a-muted)' }}>&ldquo;{invoice.notes}&rdquo;</p>}

            {invoice.status === 'anulada' && (
              <div className="rounded-lg px-3 py-2 text-[13px]" style={{ borderLeft: '4px solid var(--a-bad)', background: 'var(--a-bad-soft)', color: 'var(--a-fg)' }}>
                <b style={{ color: 'var(--a-bad)' }}>Anulada{invoice.voidedAt ? ` el ${formatShortDate(invoice.voidedAt)}` : ''}:</b> {invoice.voidReason || 'sin motivo registrado'}
              </div>
            )}
          </section>

          {/* Pagos */}
          {invoice.payments.length > 0 && (
            <section className="admin-card overflow-hidden">
              <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
                <h2 className="text-[14.5px] font-bold" style={{ color: 'var(--a-fg)' }}>Pagos recibidos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th className="r">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="nowrap admin-num">{formatShortDate(p.receivedAt)}</td>
                        <td className="capitalize">{p.method}</td>
                        <td>{p.reference || <span className="muted">—</span>}</td>
                        <td className="r admin-num nowrap"><b>{formatPrice(p.amount)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Historial */}
        <aside className="admin-card self-start print:hidden">
          <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
            <h2 className="text-[14.5px] font-bold" style={{ color: 'var(--a-fg)' }}>Historial</h2>
          </div>
          <ol className="flex flex-col px-4 pb-3.5 pt-1.5">
            {steps.map((s, i) => (
              <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 py-2">
                <span
                  className="mt-0.5 grid h-[18px] w-[18px] place-items-center rounded-full"
                  style={stepDotStyle(s.state)}
                  aria-hidden="true"
                >
                  {s.state === 'done' && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0">
                  <b className="block text-[13px] font-semibold" style={{ color: s.state === 'pending' ? 'var(--a-muted)' : s.state === 'bad' ? 'var(--a-bad)' : 'var(--a-fg)' }}>
                    {s.title}
                  </b>
                  {s.detail && <small className="block text-xs" style={{ color: 'var(--a-muted)' }}>{s.detail}</small>}
                </div>
              </li>
            ))}
          </ol>
          <div className="px-4 py-3.5" style={{ borderTop: '1px solid var(--a-line)' }}>
            <small style={{ color: 'var(--a-muted)' }}>
              Una factura emitida no se edita. Para corregirla se anula (o se emite una nota de crédito) y queda registrado quién lo hizo.
            </small>
          </div>
        </aside>
      </div>
    </div>
  );
}

function isOverdue(inv: InvoiceDocumentData) {
  return Boolean(inv.dueDate && new Date(inv.dueDate).getTime() < Date.now());
}

function stepDotStyle(state: StepState): React.CSSProperties {
  switch (state) {
    case 'done':
      return { background: 'var(--a-ok)', border: '2px solid var(--a-ok)', color: '#fff' };
    case 'now':
      return { background: 'var(--a-surface)', border: '2px solid var(--a-brand)' };
    case 'bad':
      return { background: 'var(--a-bad)', border: '2px solid var(--a-bad)' };
    default:
      return { background: 'var(--a-surface)', border: '2px solid var(--a-line)' };
  }
}
