'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, ArrowLeft, CreditCard } from 'lucide-react';
import CreditCardPreview from './CreditCardPreview';
import { formatPrice } from '@/lib/utils';
import {
  detectCardBrand, sanitizeDigits, formatCardNumber, formatExpiry,
  cardLength, cvvLength,
} from '@/lib/cardUtils';

interface PaymentStepProps {
  total: number;
  itemLabel: string;
  loading: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

const DEPOSIT_RATE = 0.3;

export default function PaymentStep({ total, itemLabel, loading, onBack, onConfirm }: PaymentStepProps) {
  const [digits, setDigits] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [flipped, setFlipped] = useState(false);

  const brand = detectCardBrand(digits);
  const deposit = Math.round(total * DEPOSIT_RATE);
  const remaining = total - deposit;

  const isValid =
    digits.length === cardLength(brand) &&
    name.trim().length > 2 &&
    expiry.length === 5 &&
    cvv.length === cvvLength(brand);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    onConfirm();
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50 hover:text-gold-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />Volver
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/40 bg-gray-100 dark:bg-navy-800 px-2.5 py-1 rounded-full">
          <Lock className="w-3 h-3" />Pago demo · sin cargo real
        </span>
      </div>

      <CreditCardPreview digits={digits} brand={brand} name={name} expiry={expiry} cvv={cvv} flipped={flipped} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
            <CreditCard className="inline w-4 h-4 text-gold-500 mr-1.5" />
            Número de tarjeta
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatCardNumber(digits, brand)}
            onChange={(e) => setDigits(sanitizeDigits(e.target.value, brand))}
            onFocus={() => setFlipped(false)}
            placeholder="4111 1111 1111 1111"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                       dark:border-white/10 text-sm text-navy-950 dark:text-white font-mono tracking-wider placeholder:text-gray-400
                       focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">Nombre del titular</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            onFocus={() => setFlipped(false)}
            placeholder="JUAN PÉREZ"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                       dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400
                       focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">Vencimiento</label>
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              onFocus={() => setFlipped(false)}
              placeholder="MM/AA"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                         dark:border-white/10 text-sm text-navy-950 dark:text-white font-mono placeholder:text-gray-400
                         focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">CVV</label>
            <input
              type="text"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, cvvLength(brand)))}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              placeholder="123"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                         dark:border-white/10 text-sm text-navy-950 dark:text-white font-mono placeholder:text-gray-400
                         focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
        </div>

        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-white/60">Total · {itemLabel}</span>
            <span className="font-semibold text-navy-950 dark:text-white">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span className="text-navy-950 dark:text-white">Depósito a pagar ahora (30%)</span>
            <span className="text-gold-500">{formatPrice(deposit)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-white/40">
            El resto, {formatPrice(remaining)}, se paga antes de iniciar el viaje.
          </p>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="btn-primary w-full justify-center text-base py-4 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full" />
              Procesando pago...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Pagar depósito y confirmar
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
