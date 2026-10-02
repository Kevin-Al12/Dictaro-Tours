'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice } from '@/lib/utils';
import type { Destination } from '@/types';

const travelTypes = ['Playa', 'Aventura', 'Cultural', 'Romántico', 'Familiar', 'Lujo'];
const continents  = ['Todos', 'Europa', 'Asia', 'América', 'África', 'Oceanía'];

export default function SearchWidget() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    query: '', continent: 'Todos', date: '', passengers: '2', budget: '', type: '',
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const query = filters.query.trim().toLowerCase();
  const suggestions = query.length > 0
    ? destinations.filter((d) => d.name.toLowerCase().includes(query) || d.country.toLowerCase().includes(query)).slice(0, 5)
    : [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.query)                     params.set('q', filters.query);
    if (filters.continent !== 'Todos')     params.set('continente', filters.continent);
    if (filters.date)                      params.set('fecha', filters.date);
    if (filters.passengers)                params.set('personas', filters.passengers);
    if (filters.budget)                    params.set('presupuesto', filters.budget);
    if (filters.type)                      params.set('tipo', filters.type);
    router.push(`/destinos?${params.toString()}`);
  };

  const goToDestination = (slug: string) => {
    setShowSuggestions(false);
    router.push(`/destinos/${slug}`);
  };

  const inputCls = `w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                    dark:border-white/10 text-sm text-navy-950 dark:text-white
                    focus:outline-none focus:border-brand-500 transition-colors`;

  return (
    <section className="relative z-20 -mt-6 sm:-mt-10 lg:-mt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl shadow-navy-950/20 p-6 border border-gray-100 dark:border-white/10"
        >
          {/* Header with brand accent */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-display font-bold text-navy-950 dark:text-white">
              Busca tu viaje ideal
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {/* Destination */}
            <div className="relative" ref={wrapperRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none z-10" />
              <input type="text" placeholder="¿A dónde quieres ir?"
                value={filters.query}
                onChange={(e) => { setFilters({ ...filters, query: e.target.value }); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
                className={`${inputCls} pl-10`} />

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-30"
                  >
                    {suggestions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => goToDestination(d.slug)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors text-left"
                      >
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0">
                          <Image src={d.image} alt={d.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-950 dark:text-white truncate">{d.name}, {d.country}</p>
                          <p className="text-xs text-gray-400 dark:text-white/40">{d.continent}</p>
                        </div>
                        <span className="text-xs font-bold text-gold-600 dark:text-gold-400 shrink-0">{formatPrice(d.price)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Continent */}
            <select value={filters.continent} onChange={(e) => setFilters({ ...filters, continent: e.target.value })}
              className={`${inputCls} appearance-none`}>
              {continents.map((c) => <option key={c} value={c}>{c === 'Todos' ? 'Todos los continentes' : c}</option>)}
            </select>

            {/* Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" />
              <input type="month" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className={`${inputCls} pl-10`} />
            </div>

            {/* Passengers */}
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" />
              <select value={filters.passengers} onChange={(e) => setFilters({ ...filters, passengers: e.target.value })}
                className={`${inputCls} pl-10 appearance-none`}>
                {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>)}
              </select>
            </div>

            {/* Budget */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" />
              <select value={filters.budget} onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                className={`${inputCls} pl-10 appearance-none`}>
                <option value="">Cualquier presupuesto</option>
                <option value="1000">Hasta $1,000</option>
                <option value="2000">Hasta $2,000</option>
                <option value="3000">Hasta $3,000</option>
                <option value="5000">Hasta $5,000</option>
              </select>
            </div>

            {/* Type */}
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className={`${inputCls} appearance-none`}>
              <option value="">Tipo de viaje</option>
              {travelTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button onClick={handleSearch} className="btn-primary w-full justify-center text-base py-3.5 shadow-md shadow-brand-600/20">
            <Search className="w-5 h-5" />
            Buscar viajes disponibles
          </button>
        </motion.div>
      </div>
    </section>
  );
}
