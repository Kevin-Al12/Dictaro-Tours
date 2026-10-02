'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, Plane, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RegistroPage() {
  const router = useRouter();
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/cliente/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'No se pudo crear la cuenta');
      return;
    }
    toast.success('¡Cuenta creada exitosamente!');
    router.push('/cliente');
  };

  const fields = [
    { id: 'name',    label: 'Nombre completo',    icon: User,  type: 'text',  placeholder: 'Juan Pérez' },
    { id: 'email',   label: 'Correo electrónico', icon: Mail,  type: 'email', placeholder: 'tu@correo.com' },
    { id: 'phone',   label: 'Teléfono/WhatsApp',  icon: Phone, type: 'tel',   placeholder: '+1 (809) 000-0000' },
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 py-20">
      <div className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80')" }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gold-gradient mb-4">
              <Plane className="w-8 h-8 text-navy-950 rotate-45" />
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-950 dark:text-white">Crear cuenta</h1>
            <p className="text-gray-500 dark:text-white/50 text-sm mt-1">Únete a D'Itaros Tours y viaja al mundo</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                  <f.icon className="inline w-4 h-4 text-gold-500 mr-1.5" />{f.label}
                </label>
                <input type={f.type} required value={form[f.id as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10
                             text-navy-950 dark:text-white placeholder:text-gray-400 text-sm
                             focus:outline-none focus:border-gold-500 transition-colors" />
              </div>
            ))}

            {[
              { id: 'password', label: 'Contraseña' },
              { id: 'confirm',  label: 'Confirmar contraseña' },
            ].map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                  <Lock className="inline w-4 h-4 text-gold-500 mr-1.5" />{f.label}
                </label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} required value={form[f.id as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                    placeholder="••••••••" minLength={8}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10
                               text-navy-950 dark:text-white placeholder:text-gray-400 text-sm
                               focus:outline-none focus:border-gold-500 transition-colors" />
                  {f.id === 'password' && (
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-white/60 cursor-pointer">
              <input type="checkbox" required className="rounded mt-0.5" />
              <span>Acepto los <button type="button" className="text-gold-500 hover:text-gold-400">términos y condiciones</button> y la política de privacidad de D'Itaros Tours.</span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60">
              {loading
                ? <span className="animate-spin w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full" />
                : <><UserPlus className="w-5 h-5" />Crear mi cuenta</>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-gold-500 hover:text-gold-400 font-semibold transition-colors">Iniciar sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
