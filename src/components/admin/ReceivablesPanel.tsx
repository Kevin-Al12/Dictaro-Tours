'use client';

import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { formatPrice, formatDate, formatShortDate } from '@/lib/utils';
import AdminTableShell from './AdminTableShell';
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
  const overdueTotal = overdue.reduce((sum, r) => sum + r.balance, 0);
  const totalDue = data?.summary.total ?? receivables.reduce((sum, r) => sum + r.balance, 0);

  const header = <PageHeader title="Cobros" subtitle="Quién debe, cuánto y desde cuándo." />;

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Total por cobrar" value={loading ? '—' : formatPrice(totalDue)} />
        <Kpi label="Vencido" value={loading ? '—' : formatPrice(overdueTotal)} color={overdueTotal > 0 ? 'var(--a-bad)' : undefined} />
        <Kpi label="Facturas abiertas" value={loading ? '—' : receivables.length} />
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
    </div>
  );
}
