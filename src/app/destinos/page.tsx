'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Clock, Users, Tag, ArrowRight, Filter, X } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import type { Destination } from '@/types';

const continents = ['Todos', 'Europa', 'Asia', 'América', 'África', 'Oceanía'];

function DestinationsContent() {
  const params   = useSearchParams();
  const [cont, setCont]   = useState(params.get('continente') || 'Todos');
  const [maxBudget, setMaxBudget] = useState(params.get('presupuesto') || '');
  const [query, setQuery] = useState(params.get('q') || '');
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      if (cont !== 'Todos' && d.continent !== cont) return false;
      if (maxBudget && d.price > parseInt(maxBudget)) return false;
      if (query && !d.name.toLowerCase().includes(query.toLowerCase()) &&
          !d.country.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [cont, maxBudget, query]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {continents.map((c) => (
          <button
            key={c}
            onClick={() => setCont(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              cont === c
                ? 'bg-gold-500 text-white'
                : 'bg-white dark:bg-navy-800 text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 hover:border-gold-500'
            }`}
          >
            {c}
          </button>
        ))}

        <select
          value={maxBudget}
          onChange={(e) => setMaxBudget(e.target.value)}
          className="px-4 py-2 rounded-full text-sm bg-white dark:bg-navy-800 border border-gray-200
                     dark:border-white/10 text-gray-600 dark:text-white/60 focus:outline-none focus:border-gold-500"
        >
          <option value="">Cualquier precio</option>
          <option value="1000">Hasta $1,000</option>
          <option value="2000">Hasta $2,000</option>
          <option value="3000">Hasta $3,000</option>
          <option value="5000">Hasta $5,000</option>
        </select>

        {(cont !== 'Todos' || maxBudget || query) && (
          <button
            onClick={() => { setCont('Todos'); setMaxBudget(''); setQuery(''); }}
            className="px-4 py-2 rounded-full text-sm flex items-center gap-1.5 text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <X className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-white/40 mb-6">
        {filtered.length} destino{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dest, i) => (
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/destinos/${dest.slug}`} className="block group">
              <div className="bg-white dark:bg-navy-900 rounded-2xl overflow-hidden shadow-lg card-hover border border-gray-100 dark:border-white/10">
                <div className="relative h-52">
                  <Image src={dest.image} alt={dest.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
                  {dest.tag && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-gold-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      <Tag className="w-3 h-3" />{dest.tag}
                    </div>
                  )}
                  {dest.originalPrice && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
                      -{calculateDiscount(dest.originalPrice, dest.price)}%
                    </div>
                  )}
                  {dest.available <= 5 && (
                    <div className="absolute bottom-4 left-4 bg-red-500/90 text-white text-xs px-3 py-1 rounded-full animate-pulse font-semibold">
                      ¡Solo {dest.available} cupos!
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-navy-950 dark:text-white group-hover:text-gold-500 transition-colors">{dest.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-white/50">{dest.country} · {dest.continent}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                      <span className="text-sm font-semibold text-navy-950 dark:text-white">{dest.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/60 mb-4 line-clamp-2">{dest.shortDescription}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{dest.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{dest.available} cupos</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                    <div>
                      {dest.originalPrice && <span className="text-xs text-gray-400 line-through block">{formatPrice(dest.originalPrice)}</span>}
                      <span className="text-xl font-bold text-gold-500">{formatPrice(dest.price)}</span>
                    </div>
                    <span className="flex items-center gap-1 text-gold-500 text-sm font-semibold">Ver más <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Filter className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-white/60 mb-2">No se encontraron destinos</h3>
          <p className="text-gray-400 dark:text-white/40 text-sm">Intenta con otros filtros</p>
        </div>
      )}
    </>
  );
}

export default function DestinosPage() {
  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      {/* Hero */}
      <div className="relative py-24 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Destinos Internacionales
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Explora el mundo con nosotros. Paquetes todo incluido a los destinos más soñados del planeta.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="text-center py-12 text-white/40">Cargando destinos...</div>}>
          <DestinationsContent />
        </Suspense>
      </div>
    </div>
  );
}
