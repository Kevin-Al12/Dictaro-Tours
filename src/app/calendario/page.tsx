'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Destination } from '@/types';

interface CalEvent {
  id: string;
  destination: string;
  country: string;
  departureDate: string;
  returnDate: string;
  price: number;
  available: number;
  total: number;
  status: 'available' | 'limited' | 'soldout';
}

function buildEvents(destinations: Destination[]): CalEvent[] {
  return destinations.flatMap((d) =>
    d.departureDates.map((date, i) => {
      const dep  = new Date(date);
      const ret  = new Date(dep);
      const days = parseInt(d.duration);
      ret.setDate(dep.getDate() + (isNaN(days) ? 7 : days));
      const avail = Math.max(0, d.available - i * 3);
      return {
        id: `${d.id}-${i}`,
        destination: d.name,
        country: d.country,
        departureDate: date,
        returnDate: ret.toISOString().split('T')[0],
        price: d.price,
        available: avail,
        total: 20,
        status: (avail === 0 ? 'soldout' : avail <= 4 ? 'limited' : 'available') as CalEvent['status'],
      };
    })
  ).sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

const months = ['Julio 2026', 'Agosto 2026', 'Septiembre 2026', 'Octubre 2026', 'Noviembre 2026', 'Diciembre 2026'];

function statusBadge(status: string) {
  if (status === 'available') return (
    <span className="flex items-center gap-1 text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
      <CheckCircle className="w-3 h-3" />Disponible
    </span>
  );
  if (status === 'limited') return (
    <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
      <AlertCircle className="w-3 h-3" />Últimos cupos
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
      <XCircle className="w-3 h-3" />Agotado
    </span>
  );
}

export default function CalendarioPage() {
  const [filter, setFilter] = useState('Todos');
  const [month, setMonth]   = useState('Todos');
  const router              = useRouter();
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');
  const events = useMemo(() => buildEvents(destinations), [destinations]);

  const filtered = events.filter((e) => {
    if (filter !== 'Todos' && e.status !== filter) return false;
    if (month !== 'Todos') {
      const [m, y] = month.split(' ');
      const monthMap: Record<string, string> = {
        Julio: '07', Agosto: '08', Septiembre: '09', Octubre: '10', Noviembre: '11', Diciembre: '12'
      };
      if (!e.departureDate.startsWith(`${y}-${monthMap[m]}`)) return false;
    }
    return true;
  });

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      <div className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Calendario de Viajes
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Consulta todas las fechas de salida disponibles y asegura tu cupo con anticipación.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['Todos', 'available', 'limited', 'soldout'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${filter === s ? 'bg-gold-500 text-white' : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60'}`}>
              {s === 'Todos' ? 'Todos' : s === 'available' ? 'Disponibles' : s === 'limited' ? 'Últimos cupos' : 'Agotados'}
            </button>
          ))}
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-navy-800 border-none text-gray-600 dark:text-white/60 focus:outline-none focus:ring-2 focus:ring-gold-500/50">
            <option value="Todos">Todos los meses</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-500 dark:text-white/50">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" />Disponible</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" />Últimos cupos (&le;4)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" />Agotado</span>
        </div>

        <div className="space-y-4">
          {filtered.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`bg-white dark:bg-navy-900 rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-5 ${
                ev.status === 'soldout' ? 'opacity-60 border-gray-100 dark:border-white/5' : 'border-gray-100 dark:border-white/10'
              }`}>
              {/* Date block */}
              <div className="shrink-0 w-16 h-16 rounded-xl bg-brand-600 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-lg leading-none">
                  {new Date(ev.departureDate).getDate()}
                </span>
                <span className="text-white/80 text-xs font-semibold">
                  {new Date(ev.departureDate).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-display font-bold text-navy-950 dark:text-white">{ev.destination}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-white/50 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gold-500" />{ev.country}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                        {formatDate(ev.departureDate)} → {formatDate(ev.returnDate)}
                      </span>
                    </div>
                  </div>
                  {statusBadge(ev.status)}
                </div>

                {/* Spots bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/40 mb-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.available} de {ev.total} cupos disponibles</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gold-500" />{formatPrice(ev.price)} /persona</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-navy-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${
                      ev.status === 'available' ? 'bg-green-500' : ev.status === 'limited' ? 'bg-yellow-500' : 'bg-red-400'
                    }`}
                      style={{ width: `${(ev.available / ev.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CTA */}
              {ev.status !== 'soldout' && (
                <button
                  onClick={() => router.push(`/reservas?destino=${encodeURIComponent(ev.destination)}&fecha=${ev.departureDate}&precio=${ev.price}`)}
                  className="btn-primary shrink-0 text-sm py-2.5 px-5"
                >
                  Reservar cupo
                </button>
              )}
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-white/50">No hay fechas disponibles con estos filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
