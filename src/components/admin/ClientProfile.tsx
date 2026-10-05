'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, FileText, Edit3 } from 'lucide-react';
import { formatPrice, formatShortDate } from '@/lib/utils';
import { Avatar, Pill, type Tone } from './ui';
import { useAdminTab } from './AdminTabContext';

export interface ClientProfileData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  notes: string | null;
  balance: number;
  totalPurchased: number;
  trips: number;
  clientSince: string;
  activity: { date: string; text: string; tone: Tone }[];
  bookings: {
    id: string;
    itemLabel: string;
    date: string | null;
    passengers: number;
    total: number;
    status: string;
    supplier: string | null;
    locator: string | null;
    createdAt: string;
  }[];
  invoices: {
    id: string;
    number: number | null;
    status: string;
    issueDate: string;
    total: number;
    amountPaid: number;
  }[];
}

const BOOKING_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada',
};
const BOOKING_TONE: Record<string, Tone> = {
  pendiente: 'warn', confirmada: 'info', cancelada: 'bad', completada: 'ok',
};
const INVOICE_LABEL: Record<string, string> = {
  borrador: 'Borrador', emitida: 'Emitida', pagada_parcial: 'Pago parcial', pagada: 'Pagada', anulada: 'Anulada',
};
const INVOICE_TONE: Record<string, Tone> = {
  borrador: 'mute', emitida: 'info', pagada_parcial: 'warn', pagada: 'ok', anulada: 'bad',
};

const DAY = 1000 * 60 * 60 * 24;

// Estado del pasaporte: vencido (bad), vence en ≤180 días (warn) o vigente (null).
export function passportStatus(expiry: string | null | undefined): { tone: Tone; label: string } | null {
  if (!expiry) return null;
  const days = (new Date(expiry).getTime() - Date.now()) / DAY;
  if (days < 0) return { tone: 'bad', label: `Vencido ${formatShortDate(expiry)}` };
  if (days <= 180) return { tone: 'warn', label: `Vence ${formatShortDate(expiry)}` };
  return null;
}

export function whatsappLink(phone: string | null | undefined) {
  const digits = phone ? phone.replace(/\D/g, '') : '';
  if (!digits) return null;
  return `https://wa.me/${digits.length === 10 ? `1${digits}` : digits}`;
}

function relativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Hoy ${d.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' })}`;
  const opts: Intl.DateTimeFormatOptions = d.getFullYear() === now.getFullYear()
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('es-DO', opts).replace('.', '');
}

const invoiceCode = (n: number | null) => (n ? `FAC-${String(n).padStart(4, '0')}` : 'Borrador');

type Tab = 'activity' | 'trips' | 'invoices';

export default function ClientProfile({ clientId, onBack, onEdit, refreshKey }: {
  clientId: string;
  onBack: () => void;
  onEdit?: (client: ClientProfileData) => void;
  refreshKey?: number;
}) {
  const { setTab: setAdminTab } = useAdminTab();
  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('activity');

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/admin/clients/${clientId}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo cargar el cliente');
      return;
    }
    const data = await res.json();
    setClient(data.client);
  }, [clientId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const back = (
    <div>
      <button type="button" onClick={onBack} className="admin-btn" data-size="sm">
        <ArrowLeft className="h-3.5 w-3.5" />Clientes
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col gap-[18px]">
        {back}
        <div className="admin-card px-4 py-10 text-center text-sm" style={{ color: 'var(--a-bad)' }}>{error}</div>
      </div>
    );
  }
  if (!client) {
    return (
      <div className="flex flex-col gap-[18px]">
        {back}
        <div className="admin-card py-10 text-center text-sm" style={{ color: 'var(--a-faint)' }}>Cargando…</div>
      </div>
    );
  }

  const wa = whatsappLink(client.phone);
  const passport = passportStatus(client.passportExpiry);
  const since = new Date(client.clientSince).getFullYear();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'activity', label: 'Actividad' },
    { id: 'trips', label: `Viajes (${client.bookings.length})` },
    { id: 'invoices', label: `Facturas (${client.invoices.length})` },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {back}
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Tarjeta del cliente */}
        <section className="admin-card flex flex-col gap-3.5 self-start p-5">
          <div className="flex items-center gap-3">
            <span className="[&>.admin-avatar]:h-[52px] [&>.admin-avatar]:w-[52px] [&>.admin-avatar]:text-lg">
              <Avatar name={client.name} />
            </span>
            <div className="min-w-0">
              <h2 className="admin-display text-xl font-bold leading-tight" style={{ color: 'var(--a-fg)' }}>{client.name}</h2>
              <small style={{ color: 'var(--a-muted)' }}>
                Cliente desde {since} · {client.trips} {client.trips === 1 ? 'viaje' : 'viajes'}
              </small>
            </div>
          </div>

          {client.balance > 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: 'var(--a-warn-soft)', color: 'var(--a-warn)' }}>
              <span>Saldo pendiente</span><span className="admin-num whitespace-nowrap">{formatPrice(client.balance)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: 'var(--a-ok-soft)', color: 'var(--a-ok)' }}>
              <span>Al día</span><span aria-hidden="true">✓</span>
            </div>
          )}

          <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 text-[13px]">
            <dt style={{ color: 'var(--a-muted)' }}>Teléfono</dt>
            <dd className="admin-num m-0 text-right">{client.phone || '—'}</dd>
            <dt style={{ color: 'var(--a-muted)' }}>Correo</dt>
            <dd className="m-0 truncate text-right" title={client.email ?? undefined}>{client.email || '—'}</dd>
            <dt style={{ color: 'var(--a-muted)' }}>Documento</dt>
            <dd className="admin-num m-0 text-right">{client.document || '—'}</dd>
            <dt style={{ color: 'var(--a-muted)' }}>Pasaporte</dt>
            <dd className="m-0 text-right">
              {client.passportNumber || client.passportExpiry ? (
                <span className="inline-flex flex-col items-end gap-1">
                  <span className="admin-num">{client.passportNumber || '—'}</span>
                  {passport ? (
                    <Pill tone={passport.tone}>{passport.label}</Pill>
                  ) : client.passportExpiry ? (
                    <small style={{ color: 'var(--a-muted)' }}>Vence {formatShortDate(client.passportExpiry)}</small>
                  ) : null}
                </span>
              ) : '—'}
            </dd>
            <dt style={{ color: 'var(--a-muted)' }}>Total comprado</dt>
            <dd className="admin-num m-0 text-right font-semibold">{formatPrice(client.totalPurchased)}</dd>
          </dl>

          {client.notes && (
            <p className="text-[13px] italic" style={{ color: 'var(--a-muted)' }}>&ldquo;{client.notes}&rdquo;</p>
          )}

          <div className="flex flex-wrap gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="admin-btn" data-size="sm">
                <MessageCircle className="h-3.5 w-3.5" />WhatsApp
              </a>
            )}
            <button type="button" className="admin-btn" data-size="sm" onClick={() => setAdminTab('quotes')}>
              <FileText className="h-3.5 w-3.5" />Cotizar viaje
            </button>
            {onEdit && (
              <button type="button" className="admin-btn" data-size="sm" onClick={() => onEdit(client)}>
                <Edit3 className="h-3.5 w-3.5" />Editar
              </button>
            )}
          </div>
        </section>

        {/* Pestañas */}
        <section className="admin-card min-w-0 overflow-hidden">
          <div className="flex gap-1 overflow-x-auto px-4" role="tablist" style={{ borderBottom: '1px solid var(--a-line)' }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="whitespace-nowrap px-2.5 py-2.5 text-sm font-semibold"
                style={{
                  color: tab === t.id ? 'var(--a-fg)' : 'var(--a-muted)',
                  borderBottom: `2px solid ${tab === t.id ? 'var(--a-brand)' : 'transparent'}`,
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'activity' && (
            client.activity.length === 0 ? (
              <Empty>Todavía no hay actividad con este cliente.</Empty>
            ) : (
              <div className="flex flex-col" role="tabpanel">
                {client.activity.map((a, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[92px_minmax(0,1fr)] gap-3.5 px-4 py-3 text-sm"
                    style={{ borderBottom: i < client.activity.length - 1 ? '1px solid var(--a-line)' : undefined }}
                  >
                    <time dateTime={a.date} className="admin-num text-xs" style={{ color: 'var(--a-faint)' }}>{relativeTime(a.date)}</time>
                    <div className="flex items-start gap-1.5" style={{ color: 'var(--a-fg)' }}>
                      <span className="admin-pill mt-[3px] shrink-0 !px-[5px]" data-tone={a.tone} aria-hidden="true" />
                      <span>{a.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'trips' && (
            client.bookings.length === 0 ? (
              <Empty>Este cliente no tiene reservas.</Empty>
            ) : (
              <div className="overflow-x-auto" role="tabpanel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Viaje</th>
                      <th>Proveedor / loc.</th>
                      <th className="r">Pax</th>
                      <th className="r">Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="nowrap admin-num">{formatShortDate(b.date || b.createdAt)}</td>
                        <td><b className="font-semibold">{b.itemLabel}</b></td>
                        <td>
                          {b.supplier || b.locator ? (
                            <span className="block leading-tight">
                              {b.supplier || '—'}
                              {b.locator && <small className="admin-num block" style={{ color: 'var(--a-muted)' }}>{b.locator}</small>}
                            </span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td className="r admin-num">{b.passengers}</td>
                        <td className="r admin-num nowrap">{b.total ? formatPrice(b.total) : <span className="muted">—</span>}</td>
                        <td><Pill tone={BOOKING_TONE[b.status] ?? 'mute'}>{BOOKING_LABEL[b.status] ?? b.status}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'invoices' && (
            client.invoices.length === 0 ? (
              <Empty>Este cliente no tiene facturas.</Empty>
            ) : (
              <div className="overflow-x-auto" role="tabpanel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha</th>
                      <th className="r">Total</th>
                      <th className="r">Saldo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.invoices.map((inv) => {
                      const balance = inv.status === 'anulada' ? 0 : Math.max(inv.total - inv.amountPaid, 0);
                      return (
                        <tr key={inv.id}>
                          <td className="nowrap admin-num">{inv.number ? <b>{invoiceCode(inv.number)}</b> : <span className="muted">Borrador</span>}</td>
                          <td className="nowrap admin-num">{formatShortDate(inv.issueDate)}</td>
                          <td className="r admin-num nowrap"><b>{formatPrice(inv.total)}</b></td>
                          <td className="r admin-num nowrap" style={{ color: balance > 0 ? 'var(--a-warn)' : 'var(--a-muted)' }}>{formatPrice(balance)}</td>
                          <td><Pill tone={INVOICE_TONE[inv.status] ?? 'mute'}>{INVOICE_LABEL[inv.status] ?? inv.status}</Pill></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm" style={{ color: 'var(--a-muted)' }}>{children}</p>;
}
