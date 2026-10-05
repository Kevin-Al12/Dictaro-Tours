'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { useAdminTab } from './AdminTabContext';
import { PageHeader, Pill, type Tone } from './ui';

interface Card {
  id: string;
  title: string;
  detail: string;
  amount: number;
  label: string;
  tone: Tone;
  targetTab: string;
}

interface Stage {
  id: string;
  name: string;
  count: number;
  total: number;
  cards: Card[];
}

export default function SalesBoardPanel() {
  const { setTab } = useAdminTab();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sales-board');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setStages(json.stages ?? []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Ventas"
        subtitle="Cada viaje avanza de izquierda a derecha, sin volver a escribir datos."
      />

      {error && (
        <div className="admin-card flex items-center gap-3 p-4 text-sm" style={{ color: 'var(--a-bad)' }}>
          No se pudo cargar el tablero de ventas.
          <button type="button" className="admin-btn ml-auto" data-size="sm" onClick={load}>Reintentar</button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(loading && stages.length === 0 ? PLACEHOLDER : stages).map((stage) => (
          <div
            key={stage.id}
            className="flex min-w-0 flex-col gap-2.5"
            style={{ background: 'var(--a-surface-2)', borderRadius: 10, padding: 12 }}
          >
            <div className="flex items-baseline justify-between gap-2 text-[13px] font-bold" style={{ color: 'var(--a-fg)' }}>
              {stage.name}
              <span className="admin-num text-xs font-medium" style={{ color: 'var(--a-muted)' }}>
                {loading && stages.length === 0 ? '…' : `${stage.count} · ${formatPrice(stage.total)}`}
              </span>
            </div>

            {loading && stages.length === 0 ? (
              <div className="h-[74px] animate-pulse rounded-lg" style={{ background: 'var(--a-surface)', border: '1px solid var(--a-line)' }} />
            ) : stage.cards.length === 0 ? (
              <p className="py-3 text-center text-xs" style={{ color: 'var(--a-faint)' }}>Nada aquí por ahora</p>
            ) : (
              stage.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setTab(card.targetTab)}
                  title={`Abrir en ${TAB_NAME[card.targetTab] ?? 'su módulo'}`}
                  className="flex flex-col gap-1 rounded-lg p-2.5 text-left transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2"
                  style={{ background: 'var(--a-surface)', border: '1px solid var(--a-line)', color: 'var(--a-fg)', outlineColor: 'var(--a-brand)' }}
                >
                  <b className="truncate text-[13px] font-semibold">{card.title}</b>
                  <small className="line-clamp-2 text-xs" style={{ color: 'var(--a-muted)' }}>{card.detail}</small>
                  <div className="mt-0.5 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="admin-num text-[13px] font-semibold">{formatPrice(card.amount)}</span>
                    <Pill tone={card.tone}>{card.label}</Pill>
                  </div>
                </button>
              ))
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

const TAB_NAME: Record<string, string> = { quotes: 'Cotizaciones', bookings: 'Reservas', invoices: 'Facturas' };

const PLACEHOLDER: Stage[] = ['Cotización', 'Aceptada', 'Reservada', 'Facturada'].map((name) => ({
  id: name,
  name,
  count: 0,
  total: 0,
  cards: [],
}));
