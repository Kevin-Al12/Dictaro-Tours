'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminTab } from './AdminTabContext';
import { PageHeader, Pill, type Tone } from './ui';

interface CalendarEvent {
  id: string;
  date: string;
  label: string;
  tone: Tone;
  kind: string;
  targetTab: string;
}

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

const LEGEND: { tone: Tone; label: string }[] = [
  { tone: 'info', label: 'Salida confirmada' },
  { tone: 'ok', label: 'Viaje completado' },
  { tone: 'mute', label: 'Por confirmar' },
  { tone: 'warn', label: 'Factura por vencer' },
  { tone: 'bad', label: 'Vencido / pasaporte' },
];

// Colores de cada estado: fondo suave + texto sólido (en móvil la barrita usa el sólido).
function toneVars(tone: Tone): React.CSSProperties {
  const soft = tone === 'mute' ? 'var(--a-surface-2)' : `var(--a-${tone}-soft)`;
  const solid = tone === 'mute' ? 'var(--a-faint)' : `var(--a-${tone})`;
  const text = tone === 'mute' ? 'var(--a-muted)' : `var(--a-${tone})`;
  return { '--ev-soft': soft, '--ev-solid': solid, color: text } as React.CSSProperties;
}

// "2026-10-07" → "mié 7 oct"
function upcomingDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').replace(',', '');
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function CalendarPanel() {
  const { setTab } = useAdminTab();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // month 0-11
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [today, setToday] = useState(() => iso(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const monthKey = `${cursor.year}-${pad(cursor.month + 1)}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?month=${monthKey}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setEvents(json.events ?? []);
      setUpcoming(json.upcoming ?? []);
      if (json.today) setToday(json.today);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => {
    const text = new Date(cursor.year, cursor.month, 1).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }, [cursor]);

  // Celdas de la cuadrícula: semanas completas de lunes a domingo.
  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const offset = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(cursor.year, cursor.month, 1 - offset + i);
      return { date: iso(d), day: d.getDate(), inMonth: d.getMonth() === cursor.month };
    });
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title={title}
        subtitle="Salidas, citas y vencimientos de toda la agencia."
        actions={
          <>
            <button type="button" className="admin-btn" onClick={() => shift(-1)} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="admin-btn" onClick={goToday}>Hoy</button>
            <button type="button" className="admin-btn" onClick={() => shift(1)} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {LEGEND.map((l) => <Pill key={l.tone} tone={l.tone}>{l.label}</Pill>)}
      </div>

      {error && (
        <div className="admin-card flex items-center gap-3 p-4 text-sm" style={{ color: 'var(--a-bad)' }}>
          No se pudo cargar el calendario.
          <button type="button" className="admin-btn ml-auto" data-size="sm" onClick={load}>Reintentar</button>
        </div>
      )}

      <section className="admin-card overflow-hidden" aria-busy={loading}>
        <div className="grid grid-cols-7" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] sm:px-2"
              style={{ color: 'var(--a-faint)', borderBottom: '1px solid var(--a-line)' }}
            >
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            const dayEvents = byDate.get(cell.date) ?? [];
            const isToday = cell.date === today;
            return (
              <div
                key={cell.date}
                className="flex min-h-[64px] min-w-0 flex-col gap-1 p-1 sm:min-h-[96px] sm:p-1.5"
                style={{
                  borderRight: (i + 1) % 7 === 0 ? undefined : '1px solid var(--a-line)',
                  borderBottom: i >= cells.length - 7 ? undefined : '1px solid var(--a-line)',
                }}
              >
                <span
                  className="grid h-[22px] w-[22px] place-items-center rounded-full text-xs font-semibold"
                  style={
                    isToday
                      ? { background: 'var(--a-brand)', color: '#fff' }
                      : { color: cell.inMonth ? 'var(--a-muted)' : 'var(--a-faint)', opacity: cell.inMonth ? 1 : 0.55 }
                  }
                  aria-current={isToday ? 'date' : undefined}
                >
                  {cell.day}
                </span>
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    title={ev.label}
                    aria-label={ev.label}
                    onClick={() => setTab(ev.targetTab)}
                    className="block h-[6px] w-full truncate rounded-[5px] bg-[var(--ev-solid)] p-0 text-left text-[0px] font-semibold sm:h-auto sm:bg-[var(--ev-soft)] sm:px-1.5 sm:py-0.5 sm:text-[11px] hover:brightness-95"
                    style={toneVars(ev.tone)}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-card p-4">
        <h2 className="admin-display mb-2 text-base font-bold" style={{ color: 'var(--a-fg)' }}>Próximos 14 días</h2>
        {upcoming.length === 0 ? (
          <p className="py-2 text-sm" style={{ color: 'var(--a-faint)' }}>
            {loading ? 'Cargando…' : 'Nada en agenda para las próximas dos semanas.'}
          </p>
        ) : (
          <ul>
            {upcoming.map((ev, i) => (
              <li key={ev.id} style={{ borderTop: i === 0 ? undefined : '1px solid var(--a-line)' }}>
                <button
                  type="button"
                  onClick={() => setTab(ev.targetTab)}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-2 text-left text-sm"
                  style={{ color: 'var(--a-fg)' }}
                >
                  <span className="admin-num w-24 shrink-0 text-xs font-semibold" style={{ color: ev.date === today ? 'var(--a-brand)' : 'var(--a-muted)' }}>
                    {ev.date === today ? 'Hoy' : upcomingDay(ev.date)}
                  </span>
                  <span className="min-w-0 flex-1 sm:truncate">{ev.label}</span>
                  <Pill tone={ev.tone}>{KIND_LABEL[ev.kind] ?? ev.kind}</Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = { salida: 'Salida', factura: 'Factura', pasaporte: 'Pasaporte' };
