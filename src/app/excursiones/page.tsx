'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Star, Calendar, Check, AlertCircle } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Excursion } from '@/types';
import ExcursionDetailModal from '@/components/excursions/ExcursionDetailModal';

const categories   = ['Todos', 'Aventura', 'Cultural', 'Trekking', 'Naturaleza', 'Gastronomía', 'Aventura Aérea'];
const difficulties = ['Todos', 'Fácil', 'Moderado', 'Difícil'];

export default function ExcursionesPage() {
  const [cat, setCat]           = useState('Todos');
  const [diff, setDiff]         = useState('Todos');
  const [selected, setSelected] = useState<Excursion | null>(null);
  const { data: excursions } = useAdminList<Excursion>('/api/excursions', 'excursions');

  const filtered = excursions.filter((e) => {
    if (cat !== 'Todos' && e.category !== cat) return false;
    if (diff !== 'Todos' && e.difficulty !== diff) return false;
    return true;
  });

  const diffColor = (d: string) => {
    if (d === 'Fácil') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (d === 'Moderado') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const spotsColor = (available: number, total: number) => {
    const pct = available / total;
    if (pct > 0.5) return 'bg-green-500';
    if (pct > 0.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      <div className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Excursiones en República Dominicana
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Descubre las maravillas dominicanas con nuestros guías expertos. Aventura, cultura y naturaleza.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${cat === c ? 'bg-gold-500 text-white' : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <button key={d} onClick={() => setDiff(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${diff === d ? 'bg-gold-500 text-white' : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exc, i) => (
            <motion.div key={exc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-navy-900 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-white/10 card-hover">
              <div className="relative h-48">
                <Image src={exc.image} alt={exc.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${diffColor(exc.difficulty)}`}>
                    {exc.difficulty}
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-navy-950/80 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium">
                  {exc.category}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between text-xs text-white mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{exc.availableSpots}/{exc.totalSpots} cupos
                    </span>
                    {exc.availableSpots <= 5 && (
                      <span className="flex items-center gap-1 text-red-400 animate-pulse">
                        <AlertCircle className="w-3 h-3" />¡Últimos cupos!
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${spotsColor(exc.availableSpots, exc.totalSpots)}`}
                      style={{ width: `${(exc.availableSpots / exc.totalSpots) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display font-bold text-navy-950 dark:text-white mb-1">{exc.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-gold-500" />{exc.location}
                </div>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-4 line-clamp-2">{exc.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exc.duration}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />{exc.rating}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {exc.includes.slice(0, 3).map((inc) => (
                    <span key={inc} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" />{inc}
                    </span>
                  ))}
                </div>

                {/* Next dates */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />Próximas fechas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exc.dates.slice(0, 3).map((d) => (
                      <span key={d} className="text-xs bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60 px-2.5 py-1 rounded-full">
                        {formatDate(d)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <span className="text-xs text-gray-400">desde </span>
                    <span className="text-xl font-bold text-gold-500">{formatPrice(exc.price)}</span>
                    <span className="text-xs text-gray-400"> /persona</span>
                  </div>
                  <button
                    onClick={() => setSelected(exc)}
                    className="btn-primary text-sm py-2.5 px-5"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selected && <ExcursionDetailModal excursion={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
