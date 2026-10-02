'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Plane, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Credenciales incorrectas');
      return;
    }
    toast.success('¡Bienvenido de vuelta!');
    const next = searchParams.get('next') || '/cliente';
    router.push(next);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80')" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gold-gradient mb-4">
              <Plane className="w-8 h-8 text-navy-950 rotate-45" />
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-950 dark:text-white">
              Iniciar sesión
            </h1>
            <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
              Accede a tu cuenta de D'Itaros Tours
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                <Mail className="inline w-4 h-4 text-gold-500 mr-1.5" />Correo electrónico
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10
                           text-navy-950 dark:text-white placeholder:text-gray-400 text-sm
                           focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                <Lock className="inline w-4 h-4 text-gold-500 mr-1.5" />Contraseña
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10
                             text-navy-950 dark:text-white placeholder:text-gray-400 text-sm
                             focus:outline-none focus:border-gold-500 transition-colors"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60">
              {loading
                ? <span className="animate-spin w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full" />
                : <><LogIn className="w-5 h-5" />Iniciar sesión</>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/registro" className="text-gold-500 hover:text-gold-400 font-semibold transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
