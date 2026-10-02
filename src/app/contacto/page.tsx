'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactoPage() {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast.success('Mensaje enviado. Te contactamos pronto.');
  };

  const contacts = [
    { icon: Phone,  label: 'Teléfono',  value: '+1 (809) 555-1234', href: 'tel:+18095551234' },
    { icon: Mail,   label: 'Correo',    value: 'info@ditarostours.com', href: 'mailto:info@ditarostours.com' },
    { icon: MapPin, label: 'Dirección', value: 'Av. Abraham Lincoln, Piantini, Santo Domingo', href: 'https://maps.google.com' },
  ];

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      <div className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1423769064001-e39a66f2c31f?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Contáctanos
          </h1>

          <p className="text-white/70 text-lg">Estamos aquí para ayudarte a planificar el viaje de tu vida.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white mb-6">Información de contacto</h2>
              <div className="space-y-4">
                {contacts.map((c) => (
                  <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                      <c.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider">{c.label}</p>
                      <p className="font-medium text-navy-950 dark:text-white group-hover:text-gold-500 transition-colors">{c.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-navy-950 dark:text-white mb-4">Horario de atención</h3>
              <div className="space-y-2 text-sm">
                {[
                  ['Lunes – Viernes', '9:00 am – 7:00 pm'],
                  ['Sábados',         '9:00 am – 4:00 pm'],
                  ['Domingos',        '10:00 am – 2:00 pm'],
                ].map(([day, hours]) => (
                  <div key={day} className="flex justify-between py-2 border-b border-gray-100 dark:border-white/10">
                    <span className="text-gray-600 dark:text-white/60">{day}</span>
                    <span className="font-medium text-navy-950 dark:text-white">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-navy-950 dark:text-white mb-4">Síguenos</h3>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, label: '@ditarostours', href: 'https://instagram.com' },
                  { icon: Facebook,  label: 'D\'Itaros Tours', href: 'https://facebook.com' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-white/10 hover:border-gold-500/50 transition-all text-sm font-medium text-navy-950 dark:text-white hover:text-gold-500">
                    <s.icon className="w-4 h-4" />{s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
            {sent ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-gold-500 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-navy-950 dark:text-white mb-2">¡Mensaje enviado!</h3>
                <p className="text-gray-600 dark:text-white/60">Te responderemos en menos de 24 horas hábiles.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-display font-bold text-navy-950 dark:text-white">Envíanos un mensaje</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'name', label: 'Nombre', placeholder: 'Juan Pérez', type: 'text' },
                    { id: 'email', label: 'Correo', placeholder: 'tu@correo.com', type: 'email' },
                  ].map((f) => (
                    <div key={f.id}>
                      <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">{f.label}</label>
                      <input type={f.type} required placeholder={f.placeholder} value={form[f.id as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">Asunto</label>
                  <input type="text" required placeholder="¿En qué podemos ayudarte?" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">Mensaje</label>
                  <textarea required rows={5} placeholder="Cuéntanos sobre tu viaje soñado..." value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gold-500 transition-colors resize-none" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 disabled:opacity-60">
                  {loading ? <span className="animate-spin w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full" /> : <><Send className="w-4 h-4" />Enviar mensaje</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
