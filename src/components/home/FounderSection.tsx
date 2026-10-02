'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote, Compass, Award } from 'lucide-react';

export default function FounderSection() {
  return (
    <section className="section-padding">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-white/10">
            <Image
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80"
              alt="Fundadora de D'Itaros Tours"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -right-5 bg-white dark:bg-navy-900 rounded-2xl px-5 py-3 shadow-lg border border-gray-100 dark:border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-navy-950 dark:text-white leading-none">10+ años</div>
              <div className="text-xs text-gray-500 dark:text-white/50">de experiencia</div>
            </div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-gold-500 text-sm font-semibold uppercase tracking-widest">Quién está detrás</span>
          <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-5">
            Conoce a nuestra <span className="text-gradient">fundadora</span>
          </h2>

          <div className="relative pl-6 border-l-2 border-gold-500/40 mb-6">
            <Quote className="w-6 h-6 text-gold-500/40 absolute -left-3.5 -top-1 bg-white dark:bg-navy-950" />
            <p className="text-gray-600 dark:text-white/70 leading-relaxed italic">
              Cada viaje que armamos lleva un pedazo de nuestra pasión. Quiero que cada cliente sienta que
              su viaje fue diseñado solo para él.
            </p>
          </div>

          <h3 className="text-xl font-display font-bold text-navy-950 dark:text-white mb-1">
            Nombre de la Fundadora
          </h3>
          <p className="text-sm text-gold-500 font-medium mb-4">Fundadora & Directora de D'Itaros Tours</p>

          <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-6">
            Con más de una década recorriendo el mundo, convirtió su pasión por viajar en D'Itaros Tours:
            una agencia dominicana dedicada a crear experiencias inolvidables para cada cliente. Desde
            escapadas por el Caribe hasta aventuras al otro lado del mundo, su misión sigue siendo la misma:
            que cada viaje se sienta hecho a la medida.
          </p>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
            <Compass className="w-4 h-4 text-gold-500" />
            Apasionada por los viajes y por conectar personas con el mundo.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
