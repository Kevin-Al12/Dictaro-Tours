'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, Users, ArrowRight, Tag } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import type { Destination } from '@/types';

export default function FeaturedPackages() {
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');
  const featured = destinations.filter((d) => d.featured).slice(0, 6);

  return (
    <section className="section-padding">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-widest">Paquetes</span>
          <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-4">
            Destinos más <span className="text-gradient-brand">populares</span>
          </h2>
          <p className="text-gray-600 dark:text-white/55 max-w-xl mx-auto">
            Los paquetes más elegidos por nuestros viajeros. Precios todo incluido, guías expertos y experiencias únicas.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.map((dest, i) => (
          <motion.div key={dest.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Link href={`/destinos/${dest.slug}`} className="block group">
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-navy-900 shadow-lg card-hover border border-gray-100 dark:border-white/10">
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <Image src={dest.image} alt={dest.name} fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />

                  {dest.tag && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 brand-gradient text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      <Tag className="w-3 h-3" />{dest.tag}
                    </div>
                  )}
                  {dest.originalPrice && (
                    <div className="absolute top-4 right-4 bg-gold-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
                      -{calculateDiscount(dest.originalPrice, dest.price)}%
                    </div>
                  )}
                  {dest.available <= 5 && (
                    <div className="absolute bottom-4 left-4 bg-brand-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
                      ¡Solo {dest.available} cupos!
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-lg text-navy-950 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {dest.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-white/45">{dest.country}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                      <span className="text-sm font-semibold text-navy-950 dark:text-white">{dest.rating}</span>
                      <span className="text-xs text-gray-400">({dest.reviews})</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-white/55 mb-4 line-clamp-2">{dest.shortDescription}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-white/40 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{dest.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{dest.available} cupos</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                    <div>
                      {dest.originalPrice && (
                        <span className="text-xs text-gray-400 line-through block">{formatPrice(dest.originalPrice)}</span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-400 dark:text-white/40">desde</span>
                        <span className="text-xl font-bold text-gold-600 dark:text-gold-400">{formatPrice(dest.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold text-sm group-hover:gap-2 transition-all">
                      Ver más <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link href="/destinos" className="btn-outline">
          Ver todos los destinos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
