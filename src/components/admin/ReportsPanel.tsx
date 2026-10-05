'use client';

import { useEffect, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice as fmt } from '@/lib/utils';

// Montos redondeados al peso para que la tabla y las tarjetas se lean parejo.
const formatPrice = (n: number) => fmt(Math.round(n));
import { PageHeader, Pill } from './ui';

interface Row { label: string; total: number }

interface ReportData {
  month: string;
  summary: { total: number; cost: number; profit: number; margin: number; count: number };
  salesBySeller: Row[];
  salesByCategory: Row[];
  salesByMonth: { month: string; total: number; profit: number }[];
  marginBySale: { id: string; code: string; clientName: string; sold: number; cost: number; profit: number; margin: number }[];
  paymentsByMethod: Row[];
}

const METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  cheque: 'Cheque',
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string, short = false) {
  const [y, m] = key.split('-').map(Number);
  const name = MONTHS[m - 1] ?? '';
  return short ? `${name.slice(0, 3)} ${String(y).slice(2)}` : `${name} ${y}`;
}

// Montos compactos para las barras: RD$ 212k, RD$ 1.2M.
function compact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
}

export function MonthStepper({ label, onPrev, onNext, nextDisabled }: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="admin-btn" onClick={onPrev} aria-label="Mes anterior" title="Mes anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[124px] text-center text-sm font-semibold" style={{ color: 'var(--a-fg)' }}>{label}</span>
      <button type="button" className="admin-btn" onClick={onNext} disabled={nextDisabled} aria-label="Mes siguiente" title="Mes siguiente">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="admin-card">
      <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
        <h2 className="text-[14.5px] font-bold" style={{ color: 'var(--a-fg)' }}>{title}</h2>
        {aside && <span className="ml-auto text-xs" style={{ color: 'var(--a-faint)' }}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Bars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (rows.length === 0 || max <= 0) {
    return <p className="px-4 py-6 text-sm" style={{ color: 'var(--a-muted)' }}>{empty}</p>;
  }
  return (
    <div className="flex flex-col gap-2.5 px-4 py-4">
      {rows.map((r) => (
        <div key={r.label} className="grid items-center gap-2.5 text-[13px]" style={{ gridTemplateColumns: 'minmax(84px, 120px) 1fr 76px' }}>
          <span className="truncate" style={{ color: 'var(--a-fg)' }} title={r.label}>{r.label}</span>
          <div className="h-3 overflow-hidden rounded-[5px]" style={{ background: 'var(--a-surface-2)' }}>
            <div
              className="h-full rounded-[5px]"
              style={{ width: `${r.value > 0 ? Math.max(2, (r.value / max) * 100).toFixed(1) : 0}%`, background: 'var(--a-chart)', opacity: 0.9 }}
              title={formatPrice(r.value)}
            />
          </div>
          <span className="admin-num text-right" style={{ color: 'var(--a-muted)' }} title={formatPrice(r.value)}>{compact(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="admin-card flex flex-col gap-1 px-4 py-3.5">
      <span className="text-xs font-semibold" style={{ color: 'var(--a-muted)' }}>{label}</span>
      <span className="admin-display admin-num break-words text-xl font-bold sm:text-2xl" style={{ color: color ?? 'var(--a-fg)' }}>{value}</span>
    </div>
  );
}

function exportCsv(data: ReportData) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const num = (n: number) => n.toFixed(2);
  const lines = [
    ['Factura', 'Cliente', 'Vendido', 'Costo', 'Ganancia', 'Margen %'].join(';'),
    ...data.marginBySale.map((r) => [r.code, r.clientName, num(r.sold), num(r.cost), num(r.profit), num(r.margin)].map(esc).join(';')),
  ];
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `margen-por-venta-${data.month}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportsPanel() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/reports?month=${month}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = (await res.json()) as ReportData;
        if (!cancelled) setData(json);
      })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el reporte'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month]);

  const isCurrent = month >= currentMonth();
  const empty = !!data && data.summary.count === 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Reportes"
        subtitle={monthLabel(month)}
        actions={
          <>
            <MonthStepper
              label={monthLabel(month)}
              onPrev={() => setMonth((m) => shiftMonth(m, -1))}
              onNext={() => setMonth((m) => shiftMonth(m, 1))}
              nextDisabled={isCurrent}
            />
            <button
              type="button"
              className="admin-btn"
              disabled={!data || data.marginBySale.length === 0}
              onClick={() => data && exportCsv(data)}
            >
              <Download className="h-4 w-4" /> Exportar a Excel
            </button>
          </>
        }
      />

      {loading && !data ? (
        <div className="admin-card py-10 text-center text-sm" style={{ color: 'var(--a-faint)' }}>Cargando…</div>
      ) : !data ? null : (
        <div className="flex flex-col gap-4" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Vendido" value={formatPrice(data.summary.total)} />
            <Kpi label="Costo de proveedores" value={formatPrice(data.summary.cost)} />
            <Kpi label="Ganancia" value={formatPrice(data.summary.profit)} color="var(--a-ok)" />
            <Kpi label="Margen" value={`${data.summary.margin.toFixed(1)}%`} />
          </div>

          {empty && (
            <section className="admin-card flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: 'var(--a-surface-2)', color: 'var(--a-faint)' }}>
                <BarChart3 className="h-5 w-5" />
              </span>
              <p className="max-w-sm text-sm" style={{ color: 'var(--a-muted)' }}>
                No hay facturas emitidas en {monthLabel(month).toLowerCase()}. Cuando factures una venta, aquí verás cuánto vendiste y cuánto ganaste.
              </p>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Ventas por vendedor" aside="Sin ITBIS">
              <Bars rows={data.salesBySeller.map((r) => ({ label: r.label, value: r.total }))} empty="Sin ventas este mes." />
            </Card>
            <Card title="Ventas por tipo" aside="Sin ITBIS">
              <Bars rows={data.salesByCategory.map((r) => ({ label: r.label, value: r.total }))} empty="Sin ventas este mes." />
            </Card>
            <Card title="Últimos 6 meses" aside="Vendido">
              <Bars rows={data.salesByMonth.map((r) => ({ label: monthLabel(r.month, true), value: r.total }))} empty="Sin ventas en los últimos 6 meses." />
            </Card>
            <Card title="Cobrado por método">
              <Bars rows={data.paymentsByMethod.map((r) => ({ label: METHOD_LABEL[r.label] ?? r.label, value: r.total }))} empty="Sin cobros registrados este mes." />
            </Card>
          </div>

          {!empty && (
            <Card title="Margen por venta" aside="Precio al cliente menos costo del proveedor">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Venta</th>
                      <th className="r">Vendido</th>
                      <th className="r">Costo</th>
                      <th className="r">Ganancia</th>
                      <th className="r">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.marginBySale.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <b className="font-semibold">{r.clientName}</b>
                          <span className="block text-xs" style={{ color: 'var(--a-muted)' }}>{r.code}</span>
                        </td>
                        <td className="r admin-num nowrap">{formatPrice(r.sold)}</td>
                        <td className="r admin-num nowrap muted">{formatPrice(r.cost)}</td>
                        <td className="r admin-num nowrap"><b style={{ color: 'var(--a-ok)' }}>{formatPrice(r.profit)}</b></td>
                        <td className="r"><Pill tone={r.margin >= 15 ? 'ok' : 'warn'}>{r.margin.toFixed(1)}%</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
