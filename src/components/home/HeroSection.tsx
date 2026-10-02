'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Users, Globe, Shield } from 'lucide-react';

const stats = [
  { icon: Users,  label: 'Viajeros felices',     value: '15,000+' },
  { icon: Globe,  label: 'Destinos',              value: '50+' },
  { icon: Star,   label: 'Calificación',          value: '4.9 / 5' },
  { icon: Shield, label: 'Años de experiencia',   value: '10+' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80')" }} />
      <div className="absolute inset-0 bg-navy-950/72" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-transparent to-navy-950" />


      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-28">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>

          {/* Logo grande en hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full p-2 shadow-2xl shadow-black/40">
              <Image
                src="/images/logo.png"
                alt="D'Itaros Tours"
                fill
                className="object-contain rounded-full"
                priority
              />
            </div>
          </motion.div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/30 mb-6">
            <Star className="w-3.5 h-3.5 text-white fill-white" />
            <span className="text-sm text-white font-medium">Agencia de viajes premium Nº 1 en República Dominicana</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight">
            Descubre el mundo
            <br />
            <span className="text-gradient-brand">con D'Itaros</span>
          </h1>

          <p className="text-base sm:text-lg text-white/65 max-w-2xl mx-auto mb-10 leading-relaxed">
            Creamos viajes únicos e inolvidables. Destinos internacionales, hoteles de lujo,
            excursiones y paquetes personalizados para vivir la experiencia de tu vida.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/destinos" className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center shadow-lg shadow-brand-600/30">
              Explorar destinos
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/reservas" className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center shadow-lg shadow-brand-600/30">
              Cotizar mi viaje
            </Link>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass rounded-2xl p-4 text-center"
              >
                <s.icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white font-display">{s.value}</div>
                <div className="text-xs text-white/55">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

    </section>
  );
}
