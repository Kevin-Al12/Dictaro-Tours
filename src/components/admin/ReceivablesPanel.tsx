'use client';

import { useEffect, useMemo, useState } from 'react';
import { Landmark, MessageCircle } from 'lucide-react';
import { formatPrice, formatDate, formatShortDate } from '@/lib/utils';
import AdminTableShell from './AdminTableShell';
import AdminModal from './AdminModal';
import { PageHeader, Who, Pill, type Tone } from './ui';

interface Receivable {
  id: string;
  number: number | null;
  clientId: string;
  clientName: string;
  total: number;
  amountPaid: number;
  balance: number;
  issueDate: string;
  dueDate: string | null;
  daysOld: number;
  bucket: string;
}

interface ReceivablesData {
  receivables: Receivable[];
  summary: { total: number; bucket0_30: number; bucket31_60: number; bucket61plus: number };
}

const DAY = 24 * 60 * 60 * 1000;

const facCode = (n: number | null) => (n ? `FAC-${String(n).padStart(4, '0')}` : 'en borrador');

// Número para wa.me: solo dígitos; los 10 dígitos locales llevan el 1 delante.
function waNumber(phone: string | null | undefined) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length === 10 ? `1${digits}` : digits;
}

// Días de atraso respecto al vencimiento (negativo = faltan días para vencer).
function daysLate(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - due.getTime()) / DAY);
}

function lateness(dueDate: string | null): { tone: Tone; label: string } {
  const d = daysLate(dueDate);
  if (d === null) return { tone: 'mute', label: 'Sin vencimiento' };
  if (d > 0) return { tone: 'bad', label: `${d} ${d === 1 ? 'día' : 'días'}` };
  if (d === 0) return { tone: 'warn', label: 'Vence hoy' };
  if (d >= -7) return { tone: 'warn', label: `Vence en ${-d} ${d === -1 ? 'día' : 'días'}` };
  return { tone: 'ok', label: 'Al día' };
}

function Kpi({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="admin-card px-4 py-3.5">
      <div className="text-xs font-semibold" style={{ color: 'var(--a-muted)' }}>{label}</div>
      <div className="admin-display admin-num mt-1 text-2xl font-bold" style={{ color: color ?? 'var(--a-fg)' }}>{value}</div>
    </div>
  );
}

export default function ReceivablesPanel() {
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remindOpen, setRemindOpen] = useState(false);
  const [phones, setPhones] = useState<Record<string, string | null> | null>(null);

  useEffect(() => {
    fetch('/api/admin/receivables')
      .then(async (res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          setErrorMessage('Tu sesión expiró. Vuelve a iniciar sesión.');
        } else if (res.status === 403) {
          setErrorMessage('No tienes permiso para ver cuentas por cobrar.');
        } else {
          const body = await res.json().catch(() => ({}));
          setErrorMessage(body.error || 'No se pudieron cargar las cuentas por cobrar.');
        }
        return null;
      })
      .then((json) => { if (json) setData(json); })
      .catch(() => setErrorMessage('No se pudieron cargar las cuentas por cobrar.'))
      .finally(() => setLoading(false));
  }, []);

  const receivables = data?.receivables ?? [];
  const overdue = receivables.filter((r) => (daysLate(r.dueDate) ?? 0) > 0);

  // Antigüedad según días vencidos: sin vencer (o sin fecha) cuenta como al día.
  const aging = { current: 0, d30: 0, d60: 0, d61: 0 };
  for (const r of receivables) {
    const d = daysLate(r.dueDate) ?? 0;
    if (d <= 0) aging.current += r.balance;
    else if (d <= 30) aging.d30 += r.balance;
    else if (d <= 60) aging.d60 += r.balance;
    else aging.d61 += r.balance;
  }

  // Vencidos agrupados por cliente para el recordatorio.
  const overdueByClient = useMemo(() => {
    const map = new Map<string, { clientId: string; clientName: string; balance: number; invoices: Receivable[] }>();
    for (const r of overdue) {
      const entry = map.get(r.clientId) ?? { clientId: r.clientId, clientName: r.clientName, balance: 0, invoices: [] };
      entry.balance += r.balance;
      entry.invoices.push(r);
      map.set(r.clientId, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!remindOpen || phones) return;
    fetch('/api/admin/clients')
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((json: { clients?: { id: string; phone: string | null }[] }) => {
        setPhones(Object.fromEntries((json.clients ?? []).map((c) => [c.id, c.phone])));
      })
      .catch(() => setPhones({}));
  }, [remindOpen, phones]);

  function reminderText(c: { clientName: string; balance: number; invoices: Receivable[] }) {
    const lines = c.invoices.map((r) => `• ${facCode(r.number)}: saldo ${formatPrice(r.balance)}${r.dueDate ? `, venció el ${formatShortDate(r.dueDate)}` : ''}`);
    return [
      `Hola ${c.clientName}, le saludamos de D'Itaros Tours.`,
      'Le recordamos amablemente que tiene un saldo pendiente:',
      ...lines,
      `Total pendiente: ${formatPrice(c.balance)}.`,
      'Si ya realizó el pago, por favor envíenos el comprobante. ¡Gracias!',
    ].join('\n');
  }

  const header = (
    <PageHeader
      title="Cobros"
      subtitle="Quién debe, cuánto y desde cuándo."
      actions={!errorMessage && (
        <button type="button" className="admin-btn" onClick={() => setRemindOpen(true)} disabled={loading}>
          <MessageCircle className="h-4 w-4" />Recordar a todos los vencidos
        </button>
      )}
    />
  );

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-[18px]">
        {header}
        <section className="admin-card flex flex-col items-center gap-2 px-4 py-12 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: 'var(--a-surface-2)', color: 'var(--a-faint)' }}>
            <Landmark className="h-5 w-5" />
          </span>
          <p className="max-w-sm text-sm" style={{ color: 'var(--a-muted)' }}>{errorMessage}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Al día" value={loading ? '—' : formatPrice(aging.current)} />
        <Kpi label="1 a 30 días" value={loading ? '—' : formatPrice(aging.d30)} color="var(--a-warn)" />
        <Kpi label="31 a 60 días" value={loading ? '—' : formatPrice(aging.d60)} color="var(--a-bad)" />
        <Kpi label="Más de 60 días" value={loading ? '—' : formatPrice(aging.d61)} color={aging.d61 > 0 ? 'var(--a-bad)' : undefined} />
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={receivables.length === 0}
        emptyIcon={Landmark}
        emptyMessage="No hay facturas con saldo pendiente. Todo está cobrado."
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Factura</th>
              <th>Vence</th>
              <th className="r">Saldo</th>
              <th>Atraso</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => {
              const late = lateness(r.dueDate);
              return (
                <tr key={r.id}>
                  <td><Who name={r.clientName} detail={`Emitida ${formatShortDate(r.issueDate)}`} /></td>
                  <td className="nowrap muted font-mono text-xs">
                    {r.number ? `FAC-${String(r.number).padStart(4, '0')}` : '—'}
                  </td>
                  <td className="nowrap">{r.dueDate ? formatShortDate(r.dueDate) : <span className="muted">—</span>}</td>
                  <td className="r nowrap admin-num">
                    <b className="font-bold">{formatPrice(r.balance)}</b>
                    {r.amountPaid > 0 && (
                      <span className="block text-xs" style={{ color: 'var(--a-muted)' }}>de {formatPrice(r.total)}</span>
                    )}
                  </td>
                  <td className="nowrap"><Pill tone={late.tone}>{late.label}</Pill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal
        open={remindOpen}
        onClose={() => setRemindOpen(false)}
        title="Recordar a los vencidos"
        subtitle={overdueByClient.length ? `${overdueByClient.length} ${overdueByClient.length === 1 ? 'cliente con saldo vencido' : 'clientes con saldo vencido'}` : undefined}
        maxWidth="max-w-lg"
      >
        {overdueByClient.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--a-muted)' }}>Nadie tiene facturas vencidas. ¡Todo al día!</p>
        ) : (
          <ul className="flex flex-col">
            {overdueByClient.map((c) => {
              const phone = phones ? waNumber(phones[c.clientId]) : '';
              return (
                <li key={c.clientId} className="flex items-center gap-3 py-2.5 text-[13px]" style={{ borderBottom: '1px solid var(--a-line)' }}>
                  <div className="min-w-0 flex-1">
                    <Who name={c.clientName} detail={`${c.invoices.map((r) => facCode(r.number)).join(', ')} · ${formatPrice(c.balance)}`} />
                  </div>
                  {!phones ? (
                    <span className="text-xs" style={{ color: 'var(--a-faint)' }}>Cargando…</span>
                  ) : phone ? (
                    <a
                      className="admin-btn"
                      data-size="sm"
                      href={`https://wa.me/${phone}?text=${encodeURIComponent(reminderText(c))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--a-faint)' }}>Sin teléfono</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminModal>
    </div>
  );
}
