'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, MapPin, Clock, Users, Check,
  Calendar, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { Excursion } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

const staticReviews = [
  { name: 'Roberto Castillo', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80', rating: 5, comment: 'Una experiencia única que no olvidaré jamás. El guía fue excelente y muy profesional.', date: 'Junio 2026' },
  { name: 'Patricia Vega',    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80', rating: 5, comment: 'Totalmente recomendado. Organización perfecta, puntualidad y atención excepcional.', date: 'Mayo 2026' },
  { name: 'Jorge Huanca',     avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&q=80', rating: 4, comment: 'Muy buena excursión, la pasamos genial en familia. Los niños disfrutaron muchísimo.', date: 'Abril 2026' },
];

const diffColor = (d: string) => {
  if (d === 'Fácil')    return 'bg-green-100 text-green-700 border-green-200';
  if (d === 'Moderado') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

interface Props {
  excursion: Excursion;
  onClose: () => void;
}

export default function ExcursionDetailModal({ excursion: exc, onClose }: Props) {
  const router              = useRouter();
  const [dateIdx, setDateIdx] = useState(0);
  const [guests, setGuests]   = useState(2);

  const total        = exc.price * guests;
  const selectedDate = exc.dates[dateIdx];
  const spotsLeft    = exc.availableSpots;

  const handleReservar = () => {
    const params = new URLSearchParams({
      excursion: exc.name,
      fecha:     selectedDate,
      personas:  String(guests),
      precio:    String(total),
    });
    onClose();
    router.push(`/reservas?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* ── Imagen principal ── */}
          <div className="relative h-56 sm:h-72 rounded-t-3xl overflow-hidden bg-gray-100">
            <Image src={exc.image} alt={exc.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${diffColor(exc.difficulty)}`}>
                {exc.difficulty}
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900/80 text-white">
                {exc.category}
              </span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* ── Header ── */}
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{exc.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-brand-500" />{exc.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-brand-500" />{exc.duration}</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-brand-500 fill-brand-500" />{exc.rating} · Excelente</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-brand-500" />{spotsLeft} cupos disponibles</span>
              </div>
              {spotsLeft <= 5 && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs font-semibold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> ¡Últimos {spotsLeft} cupos!
                </div>
              )}
            </div>

            {/* ── Descripción ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Descripción</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{exc.description}</p>
            </div>

            {/* ── Qué incluye ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">¿Qué incluye?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exc.includes.map((inc) => (
                  <div key={inc} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Reseñas ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Opiniones</h3>
              <div className="space-y-3">
                {staticReviews.map((r) => (
                  <div key={r.name} className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Image src={r.avatar} alt={r.name} width={36} height={36} className="rounded-full shrink-0 object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-brand-500 fill-brand-500" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Reserva ── */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Reservar mi cupo</h3>

              {/* Selector de fecha */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Selecciona una fecha
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDateIdx(Math.max(0, dateIdx - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-30"
                    disabled={dateIdx === 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center bg-white border border-brand-300 rounded-xl py-2 px-3">
                    <p className="text-sm font-semibold text-brand-700">{formatDate(selectedDate)}</p>
                  </div>
                  <button onClick={() => setDateIdx(Math.min(exc.dates.length - 1, dateIdx + 1))}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-30"
                    disabled={dateIdx === exc.dates.length - 1}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {exc.dates.map((d, i) => (
                    <button key={d} onClick={() => setDateIdx(i)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${i === dateIdx ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-500 hover:border-brand-400'}`}>
                      {formatDate(d)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Número de personas */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Personas (máx. {Math.min(spotsLeft, 20)})
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden w-36">
                  <button onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors font-bold">−</button>
                  <span className="flex-1 text-center text-sm font-semibold text-gray-900">{guests}</span>
                  <button onClick={() => setGuests(Math.min(Math.min(spotsLeft, 20), guests + 1))}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors font-bold">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 mb-3">
                <div className="text-sm text-gray-500">
                  {formatPrice(exc.price)} × {guests} persona{guests > 1 ? 's' : ''}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-brand-600">{formatPrice(total)}</p>
                </div>
              </div>

              <button onClick={handleReservar} className="btn-primary w-full justify-center py-3.5 text-base">
                Reservar mi cupo
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">Un asesor confirmará tu cupo y el precio final</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
