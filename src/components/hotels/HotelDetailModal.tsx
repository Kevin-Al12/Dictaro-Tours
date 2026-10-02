'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Star, MapPin, Check,
  Users, Moon, DollarSign, Phone, Wifi
} from 'lucide-react';
import type { Hotel } from '@/types';
import { formatPrice } from '@/lib/utils';

const staticReviews = [
  { name: 'María García',    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80', rating: 5, comment: 'Increíble experiencia, el servicio fue impecable y las instalaciones superaron todas mis expectativas. Definitivamente regresaré.', date: 'Mayo 2026' },
  { name: 'Carlos Mendoza',  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80', rating: 5, comment: 'Hotel de lujo en todo el sentido de la palabra. La atención al cliente es extraordinaria y la comida deliciosa.', date: 'Abril 2026' },
  { name: 'Ana Lucía Ríos',  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&q=80', rating: 4, comment: 'Muy buena opción para familia. Los niños disfrutaron muchísimo las piscinas y la playa. Volveríamos sin dudar.', date: 'Junio 2026' },
];

interface Props {
  hotel: Hotel;
  onClose: () => void;
}

export default function HotelDetailModal({ hotel, onClose }: Props) {
  const router   = useRouter();
  const images   = [hotel.image, ...hotel.gallery];
  const [imgIdx, setImgIdx] = useState(0);
  const [guests,  setGuests]  = useState(2);
  const [nights,  setNights]  = useState(3);

  const total = hotel.pricePerPerson * guests * nights;

  const prev = () => setImgIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setImgIdx((i) => (i + 1) % images.length);

  const handleReservar = () => {
    const params = new URLSearchParams({
      hotel:    hotel.name,
      personas: String(guests),
      noches:   String(nights),
      precio:   String(total),
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* ── Carrusel ── */}
          <div className="relative h-64 sm:h-80 rounded-t-3xl overflow-hidden bg-gray-100">
            <Image src={images[imgIdx]} alt={hotel.name} fill className="object-cover" />
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
              ))}
            </div>
            <button onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {hotel.category}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 px-6 pt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-brand-600' : 'border-transparent'}`}>
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* ── Header ── */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-display font-bold text-gray-900">{hotel.name}</h2>
                <div className="flex items-center gap-1 shrink-0">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-brand-500 fill-brand-500" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>{hotel.location}</span>
                <span className="text-gray-300">·</span>
                <Star className="w-4 h-4 text-brand-500 fill-brand-500" />
                <span className="font-semibold text-gray-700">{hotel.rating}</span>
                <span className="text-gray-400">({hotel.reviews} opiniones)</span>
              </div>
            </div>

            {/* ── Descripción ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Descripción</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{hotel.description}</p>
            </div>

            {/* ── Servicios ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Servicios incluidos</h3>
              <div className="flex flex-wrap gap-2">
                {hotel.services.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">
                    <Check className="w-3 h-3 text-brand-600" />{s}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Reseñas ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Opiniones de huéspedes</h3>
              <div className="space-y-4">
                {staticReviews.map((r) => (
                  <div key={r.name} className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Image src={r.avatar} alt={r.name} width={40} height={40} className="rounded-full shrink-0 object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 mb-1.5">
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

            {/* ── Calculadora de precio ── */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Calcular precio</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Personas
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors font-bold">−</button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-900">{guests}</span>
                    <button onClick={() => setGuests(Math.min(20, guests + 1))}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors font-bold">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5" /> Noches
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <button onClick={() => setNights(Math.max(1, nights - 1))}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors font-bold">−</button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-900">{nights}</span>
                    <button onClick={() => setNights(Math.min(30, nights + 1))}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors font-bold">+</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {formatPrice(hotel.pricePerPerson)} × {guests} persona{guests > 1 ? 's' : ''} × {nights} noche{nights > 1 ? 's' : ''}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total estimado</p>
                  <p className="text-2xl font-bold text-brand-600">{formatPrice(total)}</p>
                </div>
              </div>
              <button onClick={handleReservar} className="btn-primary w-full justify-center mt-3 py-3.5 text-base">
                Reservar ahora
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">Un asesor confirmará disponibilidad y precio final</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
