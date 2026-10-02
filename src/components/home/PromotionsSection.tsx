'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Timer, Copy, CheckCheck, Tag } from 'lucide-react';
import { promotions } from '@/data/promotions';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PromotionsSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Código ${code} copiado`);
    setTimeout(() => setCopied(null), 3000);
  };

  return (
    <section className="section-padding bg-cream dark:bg-navy-900/40">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
            <Tag className="w-4 h-4" />Promociones exclusivas
          </span>
          <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-4">
            Ofertas por <span className="text-gradient-brand">tiempo limitado</span>
          </h2>
          <p className="text-gray-600 dark:text-white/55 max-w-xl mx-auto">
            Aprovecha estas promociones antes de que expiren. Cupos muy limitados.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promotions.map((promo, i) => (
          <motion.div key={promo.id}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl overflow-hidden group"
          >
            <div className="relative h-52">
              <Image src={promo.image} alt={promo.title} fill
                className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />

              {/* Discount badge */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full brand-gradient flex flex-col items-center justify-center shadow-lg shadow-brand-600/40">
                <span className="text-white font-bold text-xl leading-none">{promo.discount}%</span>
                <span className="text-white text-[9px] font-bold tracking-wider">OFF</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="font-display font-bold text-white text-lg mb-1">{promo.title}</h3>
              <p className="text-white/65 text-sm mb-3 line-clamp-2">{promo.description}</p>
              <div className="flex items-center gap-2 text-white/45 text-xs mb-3">
                <Timer className="w-3.5 h-3.5" />
                <span>Válido hasta: {formatDate(promo.validUntil)}</span>
              </div>
              <button onClick={() => copyCode(promo.code)}
                className="w-full flex items-center justify-between bg-brand-600/25 hover:bg-brand-600/40
                           border border-brand-500/50 rounded-xl px-4 py-2.5 transition-all">
                <span className="font-mono font-bold text-brand-300 tracking-widest">{promo.code}</span>
                {copied === promo.code
                  ? <CheckCheck className="w-4 h-4 text-green-400" />
                  : <Copy className="w-4 h-4 text-brand-400" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
