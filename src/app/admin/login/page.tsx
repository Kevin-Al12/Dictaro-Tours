'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Credenciales incorrectas');
        setLoading(false);
        return;
      }
      toast.success('Bienvenida al panel');
      router.push(params.get('next') || '/admin');
      router.refresh();
    } catch {
      toast.error('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80')" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full brand-gradient mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-950 dark:text-white">Panel Administrativo</h1>
            <p className="text-gray-500 dark:text-white/50 text-sm mt-1">D'Itaros Tours</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">
                <Mail className="inline w-4 h-4 text-gold-500 mr-1.5" />Correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuadmin@ditarostours.com"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10
                           text-navy-950 dark:text-white placeholder:text-gray-400 text-sm
                           focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-950 dark:text-white mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                : <><LogIn className="w-5 h-5" />Entrar</>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-white/30 mt-6">
            Acceso solo para personal autorizado de D'Itaros Tours.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
