import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Users, Check, X, Calendar, ArrowLeft, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatPrice, formatDate } from '@/lib/utils';
import BookingForm from '@/components/booking/BookingForm';
import ReviewSection from '@/components/common/ReviewSection';

export async function generateStaticParams() {
  const destinations = await prisma.destination.findMany({ select: { slug: true } });
  return destinations.map((d) => ({ slug: d.slug }));
}

export default async function DestinationPage({ params }: { params: { slug: string } }) {
  const dest = await prisma.destination.findUnique({ where: { slug: params.slug } });
  if (!dest) notFound();

  const gallery = dest.gallery as string[];
  const includes = dest.includes as string[];
  const excludes = dest.excludes as string[];
  const highlights = dest.highlights as string[];
  const departureDates = dest.departureDates as string[];

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        <Image src={dest.image} alt={dest.name} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950" />
        <div className="absolute bottom-8 left-0 right-0 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/destinos" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver a destinos
            </Link>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gold-400" />
                  <span className="text-gold-400 text-sm font-medium">{dest.country} · {dest.continent}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">{dest.name}</h1>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(dest.rating) ? 'text-gold-400 fill-gold-400' : 'text-white/30'}`} />
                    ))}
                    <span className="text-white text-sm ml-1 font-semibold">{dest.rating} ({dest.reviews} reseñas)</span>
                  </div>
                  <span className="flex items-center gap-1 text-white/70 text-sm">
                    <Clock className="w-4 h-4" />{dest.duration}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">desde</p>
                <p className="text-4xl font-bold text-gold-400 font-display">{formatPrice(dest.price)}</p>
                <p className="text-white/60 text-sm">por persona</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4">Sobre este destino</h2>
              <p className="text-gray-600 dark:text-white/70 leading-relaxed">{dest.description}</p>
            </div>

            {/* Highlights */}
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4">Experiencias imperdibles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlights.map((h) => (
                  <div key={h} className="flex items-start gap-3 bg-gold-500/10 rounded-xl p-4 border border-gold-500/20">
                    <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-navy-950" />
                    </div>
                    <span className="text-sm text-navy-950 dark:text-white font-medium">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Includes / Excludes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-display font-bold text-navy-950 dark:text-white mb-4">Incluye</h3>
                <ul className="space-y-2.5">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/70">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-navy-950 dark:text-white mb-4">No incluye</h3>
                <ul className="space-y-2.5">
                  {excludes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/70">
                      <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Departure dates */}
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-gold-500" />
                Próximas fechas de salida
              </h2>
              <div className="flex flex-wrap gap-3">
                {departureDates.map((d) => (
                  <div key={d} className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm font-medium text-navy-950 dark:text-white">
                    {formatDate(d)}
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4">Galería</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {gallery.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src={img} alt={`${dest.name} ${i + 1}`} fill className="object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <ReviewSection
              storageKey={`destino-${dest.id}`}
              title="Opiniones de viajeros"
              subtitle={`${dest.reviews} reseñas verificadas · Agrega la tuya`}
            />
          </div>

          {/* Right: Booking form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-6">
                <div className="mb-6 pb-6 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gold-500" />
                    <span className="text-sm text-gray-500 dark:text-white/50">{dest.available} cupos disponibles</span>
                  </div>
                  <div className="text-3xl font-bold text-gold-500 font-display">{formatPrice(dest.price)}</div>
                  <div className="text-sm text-gray-500 dark:text-white/50">por persona · {dest.duration}</div>
                </div>
                <BookingForm destinationId={dest.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
