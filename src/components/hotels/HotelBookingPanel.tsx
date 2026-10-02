'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Users, Moon } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Hotel } from '@/types';

export default function HotelBookingPanel({ hotel }: { hotel: Hotel }) {
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(3);
  const router = useRouter();
  const total = hotel.pricePerPerson * guests * nights;

  function Counter({
    value, onChange, min = 1, max = 20,
  }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/20 flex items-center justify-center hover:border-brand-500 hover:text-brand-500 text-gray-500 dark:text-white/50 transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-lg font-bold text-navy-950 dark:text-white w-6 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/20 flex items-center justify-center hover:border-brand-500 hover:text-brand-500 text-gray-500 dark:text-white/50 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-24 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-6">
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-white/10 text-center">
        <p className="text-sm text-gray-400 dark:text-white/40 mb-1">desde</p>
        <div className="text-3xl font-bold text-brand-500 font-display">{formatPrice(hotel.pricePerPerson)}</div>
        <div className="text-sm text-gray-500 dark:text-white/50">por persona / noche</div>
      </div>

      <div className="space-y-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-navy-950 dark:text-white">
            <Users className="w-4 h-4 text-brand-500" /> Personas
          </div>
          <Counter value={guests} onChange={setGuests} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-navy-950 dark:text-white">
            <Moon className="w-4 h-4 text-brand-500" /> Noches
          </div>
          <Counter value={nights} onChange={setNights} />
        </div>
      </div>

      <div className="pt-5 border-t border-gray-100 dark:border-white/10">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs text-gray-400 dark:text-white/40 leading-relaxed">
            {formatPrice(hotel.pricePerPerson)} × {guests} pers. × {nights} noches
          </span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-navy-950 dark:text-white">Total estimado</span>
          <span className="text-2xl font-bold text-navy-950 dark:text-white font-display">{formatPrice(total)}</span>
        </div>
        <button
          onClick={() =>
            router.push(
              `/reservas?hotel=${encodeURIComponent(hotel.name)}&personas=${guests}&noches=${nights}&precio=${total}`
            )
          }
          className="btn-primary w-full justify-center py-3.5 text-base"
        >
          Reservar habitación
        </button>
        <p className="text-xs text-center text-gray-400 dark:text-white/30 mt-3">
          Sin cargos hasta confirmar
        </p>
      </div>
    </div>
  );
}
