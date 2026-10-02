import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Check, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import HotelBookingPanel from '@/components/hotels/HotelBookingPanel';
import ReviewSection from '@/components/common/ReviewSection';
import type { Hotel } from '@/types';

export async function generateStaticParams() {
  const hotels = await prisma.hotel.findMany({ select: { slug: true } });
  return hotels.map((h) => ({ slug: h.slug }));
}

export default async function HotelPage({ params }: { params: { slug: string } }) {
  const record = await prisma.hotel.findUnique({ where: { slug: params.slug } });
  if (!record) notFound();

  const services = record.services as string[];
  const gallery = record.gallery as string[];
  const hotel: Hotel = { ...record, services, gallery };

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        <Image src={hotel.image} alt={hotel.name} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950" />
        <div className="absolute bottom-8 left-0 right-0 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/hoteles"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a hoteles
            </Link>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span className="text-brand-400 text-sm font-medium">{hotel.location}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                    {hotel.category}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">{hotel.name}</h1>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                    <span className="text-white text-sm font-semibold">
                      {hotel.rating} ({hotel.reviews} reseñas)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">desde</p>
                <p className="text-4xl font-bold text-brand-400 font-display">${hotel.pricePerPerson}</p>
                <p className="text-white/60 text-sm">por persona / noche</p>
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
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4">
                Sobre este hotel
              </h2>
              <p className="text-gray-600 dark:text-white/70 leading-relaxed text-base">{hotel.description}</p>
            </div>

            {/* Services */}
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4">
                Servicios y amenidades
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.services.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2.5 bg-gray-50 dark:bg-navy-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-white/10"
                  >
                    <div className="w-5 h-5 rounded-full brand-gradient flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-navy-950 dark:text-white font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-4">Galería</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="relative col-span-2 aspect-video rounded-2xl overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {hotel.gallery.slice(0, 4).map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src={img}
                      alt={`${hotel.name} ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <ReviewSection
              storageKey={`hotel-${hotel.id}`}
              title="Opiniones de huéspedes"
              subtitle={`${hotel.reviews} reseñas verificadas · Agrega la tuya`}
            />
          </div>

          {/* Right: Booking */}
          <div className="lg:col-span-1">
            <HotelBookingPanel hotel={hotel} />
          </div>
        </div>
      </div>
    </div>
  );
}
