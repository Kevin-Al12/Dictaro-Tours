'use client';

import { useEffect, useState } from 'react';
import { Download, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatShortDate } from '@/lib/utils';
import { PageHeader, Pill, type Tone } from './ui';
import { MonthStepper } from './ReportsPanel';

// Montos fiscales con centavos (como van en el archivo).
const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n);

interface DgiiData {
  period: string;
  rnc: string | null;
  f606: { available: boolean };
  f607: {
    count: number;
    subtotal: number;
    itbis: number;
    total: number;
    withoutNcf: number;
    rows: {
      id: string;
      code: string;
      clientName: string;
      document: string | null;
      issueDate: string;
      ncfNumber: string | null;
      subtotal: number;
      itbis: number;
      total: number;
    }[];
  };
  f608: { count: number; rows: { id: string; code: string; clientName: string; ncfNumber: string | null; voidedAt: string | null }[] };
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const pad2 = (n: number) => String(n).padStart(2, '0');

function previousPeriod() {
  const d = new Date();
  const p = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${p.getFullYear()}${pad2(p.getMonth() + 1)}`;
}

function shiftPeriod(period: string, delta: number) {
  const d = new Date(Number(period.slice(0, 4)), Number(period.slice(4)) - 1 + delta, 1);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}`;
}

function periodLabel(period: string) {
  return `${MONTHS[Number(period.slice(4)) - 1]} ${period.slice(0, 4)}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function FormCard({ code, title, summary, tone, status, action }: {
  code: string;
  title: string;
  summary: React.ReactNode;
  tone: Tone;
  status: string;
  action: React.ReactNode;
}) {
  return (
    <section className="admin-card flex flex-col gap-1.5 p-4">
      <span className="admin-display admin-num text-[22px] font-bold" style={{ color: 'var(--a-chart)' }}>DGII-{code}</span>
      <b className="font-semibold" style={{ color: 'var(--a-fg)' }}>{title}</b>
      <p className="text-[13px]" style={{ color: 'var(--a-muted)' }}>{summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <Pill tone={tone}>{status}</Pill>
        <div className="ml-auto">{action}</div>
      </div>
    </section>
  );
}

export default function DgiiPanel() {
  const [period, setPeriod] = useState(previousPeriod);
  const [data, setData] = useState<DgiiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/dgii?period=${period}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = (await res.json()) as DgiiData;
        if (!cancelled) setData(json);
      })
      .catch(() => { if (!cancelled) toast.error('No se pudieron cargar los datos de la DGII'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const nextMonth = MONTHS[Number(shiftPeriod(period, 1).slice(4)) - 1];
  const nowPeriod = (() => { const d = new Date(); return `${d.getFullYear()}${pad2(d.getMonth() + 1)}`; })();
  const f607 = data?.f607;
  const f608 = data?.f608;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Impuestos DGII"
        subtitle={`Formatos de envío de ${periodLabel(period)} · se presentan antes del 15 de ${nextMonth}.`}
        actions={
          <MonthStepper
            label={cap(periodLabel(period))}
            onPrev={() => setPeriod((p) => shiftPeriod(p, -1))}
            onNext={() => setPeriod((p) => shiftPeriod(p, 1))}
            nextDisabled={period >= nowPeriod}
          />
        }
      />

      <div className="flex gap-3 rounded-[10px] px-4 py-3 text-[13px]" style={{ background: 'var(--a-info-soft)', color: 'var(--a-fg)' }}>
        <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--a-info)' }} />
        <p>
          <b style={{ color: 'var(--a-info)' }}>Facturación electrónica obligatoria desde el 15 de noviembre de 2026.</b>{' '}
          Estos archivos son un borrador para revisar con tu contador antes de enviarlos por la Oficina Virtual.
        </p>
      </div>

      {loading && !data ? (
        <div className="admin-card py-10 text-center text-sm" style={{ color: 'var(--a-faint)' }}>Cargando…</div>
      ) : !data || !f607 || !f608 ? null : (
        <div className="flex flex-col gap-4" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormCard
              code="606"
              title="Compras de bienes y servicios"
              summary="Todavía no se registran las facturas de proveedores en el sistema."
              tone="mute"
              status="Falta registrar compras"
              action={
                <button
                  type="button"
                  className="admin-btn"
                  data-size="sm"
                  disabled
                  title="Para generar el 606 primero hay que registrar las compras a proveedores (con su NCF e ITBIS). Por ahora prepáralo con tu contador."
                >
                  Generar archivo .txt
                </button>
              }
            />
            <FormCard
              code="607"
              title="Ventas de bienes y servicios"
              summary={`${f607.count} ${f607.count === 1 ? 'comprobante' : 'comprobantes'} · ITBIS facturado ${formatPrice(f607.itbis)}`}
              tone={f607.count > 0 ? 'ok' : 'mute'}
              status={f607.count > 0 ? 'Listo para revisar' : 'Sin ventas en el período'}
              action={
                f607.count > 0 ? (
                  <a className="admin-btn" data-size="sm" href={`/api/admin/dgii?period=${period}&format=607`} download>
                    <Download className="h-3.5 w-3.5" /> Generar archivo .txt
                  </a>
                ) : (
                  <button type="button" className="admin-btn" data-size="sm" disabled>Generar archivo .txt</button>
                )
              }
            />
            <FormCard
              code="608"
              title="Comprobantes anulados"
              summary={`${f608.count} ${f608.count === 1 ? 'anulado' : 'anulados'}`}
              tone={f608.count > 0 ? 'warn' : 'ok'}
              status={f608.count > 0 ? `Revisar ${f608.count} ${f608.count === 1 ? 'registro' : 'registros'}` : 'Sin anulaciones'}
              action={
                f608.count > 0 ? (
                  <a className="admin-btn" data-size="sm" href={`/api/admin/dgii?period=${period}&format=608`} download>
                    <Download className="h-3.5 w-3.5" /> Generar archivo .txt
                  </a>
                ) : (
                  <button type="button" className="admin-btn" data-size="sm" disabled>Generar archivo .txt</button>
                )
              }
            />
          </div>

          <section className="admin-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
              <h2 className="text-[14.5px] font-bold" style={{ color: 'var(--a-fg)' }}>Detalle del 607</h2>
              {f607.withoutNcf > 0 && <Pill tone="warn">{f607.withoutNcf} sin NCF</Pill>}
              <span className="ml-auto text-xs" style={{ color: 'var(--a-faint)' }}>
                Total facturado {formatPrice(f607.total)}
              </span>
            </div>
            {f607.rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--a-muted)' }}>
                No hay facturas emitidas en {periodLabel(period)}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>Fecha</th>
                      <th className="r">Subtotal</th>
                      <th className="r">ITBIS</th>
                      <th className="r">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f607.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="nowrap">
                          <b className="font-semibold">{r.code}</b>
                          <span className="block text-xs">
                            {r.ncfNumber ? <span style={{ color: 'var(--a-muted)' }}>{r.ncfNumber}</span> : <Pill tone="warn">Sin NCF</Pill>}
                          </span>
                        </td>
                        <td>{r.clientName}</td>
                        <td className="admin-num nowrap muted">{r.document || '—'}</td>
                        <td className="nowrap muted">{formatShortDate(r.issueDate)}</td>
                        <td className="r admin-num nowrap">{formatPrice(r.subtotal)}</td>
                        <td className="r admin-num nowrap">{formatPrice(r.itbis)}</td>
                        <td className="r admin-num nowrap"><b>{formatPrice(r.total)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {f607.withoutNcf > 0 && (
              <p className="px-4 py-3 text-xs" style={{ color: 'var(--a-muted)', borderTop: '1px solid var(--a-line)' }}>
                Las facturas sin NCF son documentos internos hasta que se conecte el proveedor de e-CF; en el archivo aparecen como «SIN-NCF» para que tu contador las identifique.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
