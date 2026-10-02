'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewsletterSection() {
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success('¡Te has suscrito exitosamente!');
  };

  return (
    <section className="py-20 bg-navy-950 relative overflow-hidden">
      {/* Brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,30,44,0.08),transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-px brand-gradient opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-px brand-gradient opacity-50" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full brand-gradient mb-6 shadow-lg shadow-brand-600/40">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-4xl font-display font-bold text-white mb-4">
            Suscríbete y recibe<br />
            <span className="text-gradient-brand">ofertas exclusivas</span>
          </h2>
          <p className="text-white/55 mb-8">
            Recibe en tu correo las mejores promociones, destinos nuevos y consejos de viaje.
            Sin spam, solo lo mejor de D'Itaros Tours.
          </p>

          {submitted ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3">
              <CheckCircle className="w-16 h-16 text-brand-400" />
              <p className="text-white text-lg font-semibold">¡Gracias por suscribirte!</p>
              <p className="text-white/55 text-sm">Pronto recibirás nuestras mejores ofertas.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com" required
                className="flex-1 px-5 py-4 rounded-full bg-white/10 border border-white/20
                           text-white placeholder:text-white/35 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button type="submit" className="btn-primary px-8 py-4 rounded-full whitespace-nowrap shadow-lg shadow-brand-600/30">
                <Send className="w-4 h-4" />Suscribirme
              </button>
            </form>
          )}
          <p className="text-white/25 text-xs mt-4">
            Al suscribirte aceptas nuestra política de privacidad. Puedes darte de baja en cualquier momento.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
