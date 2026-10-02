'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Phone, Mail, MessageSquare, MessageCircle,
  CheckCircle, Plane, ArrowRight, Hotel, Compass,
} from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import PaymentStep from './PaymentStep';
import type { Destination } from '@/types';

interface HotelPrefill {
  name: string;
  total: number;
  guests: number;
  nights: number;
}

interface ExcursionPrefill {
  name: string;
  total: number;
  guests: number;
  date: string;
}

interface BookingFormProps {
  destinationId?: string;
  hotelPrefill?: HotelPrefill;
  excursionPrefill?: ExcursionPrefill;
}

export default function BookingForm({ destinationId, hotelPrefill, excursionPrefill }: BookingFormProps) {
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [form, setForm]   = useState({
    destination: destinationId || '',
    date:        '',
    passengers:  '2',
    name:        '',
    email:       '',
    phone:       '',
    notes:       '',
    type:        'booking' as 'booking' | 'quote',
  });

  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');
  const isLockedItem = Boolean(hotelPrefill || excursionPrefill);
  const dest = destinations.find((d) => d.id === form.destination);

  const total = hotelPrefill
    ? hotelPrefill.total
    : excursionPrefill
    ? excursionPrefill.total
    : dest
    ? dest.price * parseInt(form.passengers)
    : 0;

  const itemLabel = hotelPrefill
    ? hotelPrefill.name
    : excursionPrefill
    ? excursionPrefill.name
    : dest
    ? `${dest.name}, ${dest.country}`
    : 'tu paquete';

  const submitBooking = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          itemType: hotelPrefill ? 'hotel' : excursionPrefill ? 'excursion' : 'destino',
          itemLabel,
          date: excursionPrefill?.date || form.date || null,
          passengers: hotelPrefill?.guests ?? excursionPrefill?.guests ?? parseInt(form.passengers, 10),
          total,
          notes: form.notes,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.booking?.id ?? null;
    } catch {
      return null;
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.type === 'booking') {
      setStep(2);
      return;
    }
    setLoading(true);
    const id = await submitBooking();
    setLoading(false);
    if (!id) {
      toast.error('No se pudo enviar tu solicitud. Intenta de nuevo o contáctanos por WhatsApp.');
      return;
    }
    setBookingId(id);
    setStep(3);
    toast.success('¡Cotización enviada exitosamente!');
  };

  const handlePaymentConfirm = async () => {
    setLoading(true);
    const id = await submitBooking();
    setLoading(false);
    if (!id) {
      toast.error('El pago se procesó pero no pudimos guardar tu reserva. Contáctanos por WhatsApp con tu comprobante.');
      return;
    }
    setBookingId(id);
    setStep(3);
    toast.success('¡Depósito procesado y reserva confirmada!');
  };

  if (step === 3) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-12"
      >
        <CheckCircle className="w-20 h-20 text-gold-500 mx-auto mb-6" />
        <h3 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-3">
          ¡{form.type === 'booking' ? 'Reserva confirmada' : 'Cotización enviada'}!
        </h3>
        <p className="text-gray-600 dark:text-white/60 max-w-md mx-auto mb-6">
          {form.type === 'booking'
            ? 'Tu depósito fue procesado (modo demo) y tu reserva quedó confirmada. Un asesor de viajes te contactará en menos de 2 horas al número '
            : 'Hemos recibido tu solicitud. Un asesor de viajes te contactará en menos de 2 horas al número '}
          <strong className="text-gold-500">{form.phone}</strong> o al correo{' '}
          <strong className="text-gold-500">{form.email}</strong>.
        </p>
        {bookingId && (
          <p className="text-sm text-gray-400 dark:text-white/40">
            Código de reserva: <strong className="font-mono text-gold-500">DIT-{bookingId.slice(-6).toUpperCase()}</strong>
          </p>
        )}
      </motion.div>
    );
  }

  if (step === 2) {
    return (
      <PaymentStep
        total={total}
        itemLabel={itemLabel}
        loading={loading}
        onBack={() => setStep(1)}
        onConfirm={handlePaymentConfirm}
      />
    );
  }

  return (
    <form onSubmit={handleDetailsSubmit} className="space-y-6">
      {/* Type selector */}
      <div className="flex gap-3">
        {(['booking', 'quote'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm({ ...form, type: t })}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all inline-flex items-center justify-center gap-2 ${
              form.type === t
                ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-gold-500/50'
            }`}
          >
            {t === 'booking'
              ? <><Plane className="w-4 h-4" />Reservar</>
              : <><MessageCircle className="w-4 h-4" />Solicitar cotización</>}
          </button>
        ))}
      </div>

      {isLockedItem ? (
        /* Locked item summary — hotel room or excursion spot already chosen upstream */
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10">
          <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center shrink-0">
            {hotelPrefill ? <Hotel className="w-5 h-5 text-white" /> : <Compass className="w-5 h-5 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-navy-950 dark:text-white truncate">{itemLabel}</p>
            <p className="text-xs text-gray-500 dark:text-white/50">
              {hotelPrefill && `${hotelPrefill.guests} persona(s) · ${hotelPrefill.nights} noche(s)`}
              {excursionPrefill && `${excursionPrefill.guests} persona(s) · ${formatDate(excursionPrefill.date)}`}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
              <Plane className="inline w-4 h-4 text-gold-500 mr-1.5" />
              Destino
            </label>
            <select
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                         dark:border-white/10 text-sm text-navy-950 dark:text-white
                         focus:outline-none focus:border-gold-500 transition-colors appearance-none"
            >
              <option value="">Selecciona un destino</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}, {d.country}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                <Calendar className="inline w-4 h-4 text-gold-500 mr-1.5" />
                Fecha de viaje
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                           dark:border-white/10 text-sm text-navy-950 dark:text-white
                           focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                <Users className="inline w-4 h-4 text-gold-500 mr-1.5" />
                Pasajeros
              </label>
              <select
                value={form.passengers}
                onChange={(e) => setForm({ ...form, passengers: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                           dark:border-white/10 text-sm text-navy-950 dark:text-white
                           focus:outline-none focus:border-gold-500 transition-colors appearance-none"
              >
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Personal info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">Nombre completo</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Juan Pérez"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                       dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400
                       focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
            <Phone className="inline w-4 h-4 text-gold-500 mr-1.5" />
            Teléfono / WhatsApp
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            placeholder="+1 (809) 000-0000"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                       dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400
                       focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
          <Mail className="inline w-4 h-4 text-gold-500 mr-1.5" />
          Correo electrónico
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          placeholder="tu@correo.com"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                     dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400
                     focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
          <MessageSquare className="inline w-4 h-4 text-gold-500 mr-1.5" />
          Comentarios adicionales
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Preferencias especiales, fechas alternativas, preguntas..."
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200
                     dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400
                     focus:outline-none focus:border-gold-500 transition-colors resize-none"
        />
      </div>

      {/* Price summary */}
      {total > 0 && (
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-white/60">
              {itemLabel}{!isLockedItem && ` × ${form.passengers} persona(s)`}
            </span>
            {!isLockedItem && dest && (
              <span className="font-semibold text-navy-950 dark:text-white">{formatPrice(dest.price)} c/u</span>
            )}
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span className="text-navy-950 dark:text-white">Total estimado</span>
            <span className="text-gold-500">{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-1">*Precio referencial. Un asesor confirmará el precio final.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center text-base py-4 disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="animate-spin w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full" />
            Enviando...
          </>
        ) : (
          <>
            {form.type === 'booking'
              ? <><ArrowRight className="w-5 h-5" />Continuar al pago</>
              : <><MessageCircle className="w-5 h-5" />Solicitar cotización</>}
          </>
        )}
      </button>
    </form>
  );
}
