'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { testimonials } from '@/data/testimonials';
import { formatDate } from '@/lib/utils';

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  const t = testimonials[current];

  return (
    <section id="testimonios" className="section-padding">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-gold-500 text-sm font-semibold uppercase tracking-widest">Testimonios</span>
          <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-4">
            Lo que dicen nuestros <span className="text-gradient">viajeros</span>
          </h2>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-navy-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-white/10"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-gold-500 shrink-0">
                <Image src={t.avatar} alt={t.name} fill className="object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-navy-950 dark:text-white">{t.name}</h4>
                  {t.verified && (
                    <CheckCircle className="w-4 h-4 text-gold-500 fill-gold-500" />
                  )}
                </div>
                <p className="text-sm text-gold-500 font-medium">{t.destination}</p>
                <p className="text-xs text-gray-400 dark:text-white/40">{formatDate(t.date)}</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < t.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 dark:text-white/20'}`}
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-600 dark:text-white/70 leading-relaxed text-lg italic">
              "{t.comment}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={prev} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/20
                                            flex items-center justify-center hover:border-gold-500 hover:text-gold-500
                                            text-gray-500 dark:text-white/50 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-2.5 bg-gold-500' : 'w-2.5 h-2.5 bg-gray-300 dark:bg-white/20'
                }`}
              />
            ))}
          </div>

          <button onClick={next} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/20
                                            flex items-center justify-center hover:border-gold-500 hover:text-gold-500
                                            text-gray-500 dark:text-white/50 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
