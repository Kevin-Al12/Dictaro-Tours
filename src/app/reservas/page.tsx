'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plane, Shield, Clock, Star } from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import { useAdminList } from '@/hooks/useAdminList';
import type { Destination } from '@/types';

const perks = [
  { icon: Shield, title: 'Reserva segura', desc: 'Tus datos están 100% protegidos con encriptación SSL.' },
  { icon: Clock,  title: 'Respuesta en 2h', desc: 'Un asesor te contactará en menos de 2 horas hábiles.' },
  { icon: Star,   title: 'Mejor precio',   desc: 'Garantizamos el mejor precio o te devolvemos la diferencia.' },
];

function ReservasForm() {
  const params = useSearchParams();
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');

  const hotelName     = params.get('hotel');
  const excursionName = params.get('excursion');
  const destinoName   = params.get('destino');
  const precio        = parseInt(params.get('precio') || '0');
  const personas      = parseInt(params.get('personas') || '2');
  const noches        = parseInt(params.get('noches') || '1');
  const fecha         = params.get('fecha') || '';

  const hotelPrefill = hotelName
    ? { name: hotelName, total: precio, guests: personas, nights: noches }
    : undefined;

  const excursionPrefill = excursionName
    ? { name: excursionName, total: precio, guests: personas, date: fecha }
    : undefined;

  const matchedDestination = destinoName
    ? destinations.find((d) => d.name === destinoName)
    : undefined;

  return (
    <BookingForm
      destinationId={matchedDestination?.id}
      hotelPrefill={hotelPrefill}
      excursionPrefill={excursionPrefill}
    />
  );
}

export default function ReservasPage() {
  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      <div className="relative py-20 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Sistema de Reservas
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Reserva tu viaje, hotel o excursión, o solicita una cotización personalizada. Sin costos adicionales ni sorpresas.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left: Benefits + info */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white">
              ¿Por qué reservar con nosotros?
            </h2>
            <div className="space-y-4">
              {perks.map((p) => (
                <div key={p.title} className="flex gap-4 p-4 bg-gray-50 dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                    <p.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-950 dark:text-white mb-1">{p.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-white/60">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-gray-50 dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center mb-3">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-navy-950 dark:text-white mb-2">¿Necesitas ayuda?</h3>
              <p className="text-gray-600 dark:text-white/60 text-sm mb-4">
                Nuestros asesores están disponibles de lunes a sábado de 9am a 7pm y domingos de 10am a 2pm.
              </p>
              <a
                href="https://wa.me/18095551234"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm py-2.5 w-full justify-center"
              >
                Chatear por WhatsApp
              </a>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
              <h3 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-6">
                Formulario de reserva
              </h3>
              <Suspense fallback={null}>
                <ReservasForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
