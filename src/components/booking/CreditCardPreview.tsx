'use client';

import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { maskedCardNumber, brandLabel, type CardBrand } from '@/lib/cardUtils';

interface CreditCardPreviewProps {
  digits: string;
  brand: CardBrand;
  name: string;
  expiry: string;
  cvv: string;
  flipped: boolean;
}

export default function CreditCardPreview({ digits, brand, name, expiry, cvv, flipped }: CreditCardPreviewProps) {
  return (
    <div className="w-full max-w-[340px] mx-auto" style={{ perspective: 1200 }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="relative aspect-[1.586/1] w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between text-white shadow-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #16130f 0%, #2a1518 55%, #16130f 100%)',
          }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 top-16 w-24 h-24 rounded-full bg-brand-600/20" />

          <div className="flex items-start justify-between relative">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-gold-300 to-gold-600" />
            <div className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 rotate-90 text-white/70" />
              <span className="text-sm font-bold italic tracking-wide">
                {brand === 'unknown' ? '' : brandLabel[brand]}
              </span>
            </div>
          </div>

          <div className="relative">
            <p className="font-mono text-lg sm:text-xl tracking-[0.15em] text-white/95">
              {maskedCardNumber(digits, brand)}
            </p>
          </div>

          <div className="flex items-end justify-between relative">
            <div className="min-w-0">
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Titular</p>
              <p className="text-xs sm:text-sm font-medium uppercase truncate max-w-[180px]">
                {name || 'NOMBRE APELLIDO'}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Vence</p>
              <p className="text-xs sm:text-sm font-medium font-mono">{expiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #16130f 0%, #2a1518 55%, #16130f 100%)',
          }}
        >
          <div className="w-full h-11 bg-black mt-6" />
          <div className="px-5 mt-5">
            <div className="bg-white/90 rounded h-9 flex items-center justify-end px-3">
              <span className="font-mono italic text-navy-950 text-sm tracking-widest">
                {cvv.padEnd(3, '•')}
              </span>
            </div>
            <p className="text-[9px] text-white/40 mt-2 text-right uppercase tracking-wider">CVV</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
