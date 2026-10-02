'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Check, Filter, ArrowRight } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice } from '@/lib/utils';
import type { Hotel } from '@/types';

const departments = ['Todos', 'Santo Domingo', 'Punta Cana', 'La Romana', 'Bayahibe', 'Puerto Plata'];
const categories   = ['Todos', 'Lujo', 'Resort', 'Boutique', 'Eco-Lujo', 'Exclusivo', 'Clásico'];

export default function HotelesPage() {
  const [dept, setDept] = useState('Todos');
  const [cat, setCat]   = useState('Todos');
  const { data: hotels } = useAdminList<Hotel>('/api/hotels', 'hotels');

  const filtered = hotels.filter((h) => {
    if (dept !== 'Todos' && h.department !== dept) return false;
    if (cat !== 'Todos' && h.category !== cat) return false;
    return true;
  });

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      {/* Hero */}
      <div className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Hoteles en República Dominicana
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Punta Cana, La Romana, Samaná y más. Seleccionados por calidad y experiencia.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-white/50 flex items-center gap-1 mr-2">
              <Filter className="w-4 h-4" /> Departamento:
            </span>
            {departments.map((d) => (
              <button key={d} onClick={() => setDept(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${dept === d ? 'bg-gold-500 text-white' : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60 hover:border-gold-500'}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-white/50 flex items-center gap-1 mr-2">
              <Star className="w-4 h-4" /> Categoría:
            </span>
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${cat === c ? 'bg-gold-500 text-white' : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60 hover:border-gold-500'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-navy-900 rounded-2xl overflow-hidden shadow-lg card-hover border border-gray-100 dark:border-white/10"
            >
              <div className="relative h-48">
                <Image src={hotel.image} alt={hotel.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
                <div className="absolute top-4 right-4 bg-navy-950/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
                  {hotel.category}
                </div>
                <div className="absolute bottom-4 left-4 flex">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                  ))}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display font-bold text-navy-950 dark:text-white mb-1">{hotel.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-gold-500" />
                  <span>{hotel.location}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-4 line-clamp-2">{hotel.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {hotel.services.slice(0, 4).map((s) => (
                    <span key={s} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-white/60 px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3 text-gold-500" />{s}
                    </span>
                  ))}
                  {hotel.services.length > 4 && (
                    <span className="text-xs text-gray-400 dark:text-white/30 px-2.5 py-1">+{hotel.services.length - 4} más</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <p className="text-xs text-gray-400">desde</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-gold-500">{formatPrice(hotel.pricePerPerson)}</span>
                      <span className="text-xs text-gray-400">/persona</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                    <span className="font-semibold text-sm text-navy-950 dark:text-white">{hotel.rating}</span>
                    <span className="text-xs text-gray-400">({hotel.reviews})</span>
                  </div>
                </div>

                <Link href={`/hoteles/${hotel.slug}`} className="btn-primary w-full justify-center mt-4 text-sm py-3">
                  Ver detalles y reservar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
