'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Plane, CreditCard, Heart, Bell,
  CheckCircle, Clock, XCircle, LogOut, Settings, FileText, Receipt,
} from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Destination } from '@/types';

interface ClientInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

interface BookingRow {
  id: string;
  type: string;
  itemType: string;
  itemLabel: string;
  date: string | null;
  passengers: number;
  total: number;
  status: string;
  createdAt: string;
}

interface QuoteItemRow {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface InvoiceRow {
  id: string;
  number: number | null;
  status: string;
  total: number;
  amountPaid: number;
}

interface QuoteRow {
  id: string;
  number: number;
  status: string;
  total: number;
  createdAt: string;
  items: QuoteItemRow[];
  invoice: InvoiceRow | null;
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada',
};
const BOOKING_STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-600', confirmada: 'bg-green-500/10 text-green-600',
  cancelada: 'bg-red-500/10 text-red-400', completada: 'bg-blue-500/10 text-blue-600',
};
const bookingStatusIcon = (s: string) => {
  if (s === 'confirmada' || s === 'completada') return <CheckCircle className="w-4 h-4" />;
  if (s === 'pendiente') return <Clock className="w-4 h-4" />;
  return <XCircle className="w-4 h-4" />;
};

const QUOTE_STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador', enviada: 'Enviada', aceptada: 'Aceptada', vencida: 'Vencida',
};
const QUOTE_STATUS_COLOR: Record<string, string> = {
  borrador: 'bg-gray-500/10 text-gray-500', enviada: 'bg-blue-500/10 text-blue-600',
  aceptada: 'bg-green-500/10 text-green-600', vencida: 'bg-red-500/10 text-red-400',
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  borrador: 'Factura en borrador', emitida: 'Factura emitida', pagada_parcial: 'Pago parcial',
  pagada: 'Pagada', anulada: 'Factura anulada',
};

const tabs = [
  { id: 'bookings', label: 'Mis reservas', icon: Plane },
  { id: 'saved',    label: 'Guardados',    icon: Heart },
  { id: 'profile',  label: 'Mi perfil',    icon: User },
];

export default function ClientePage() {
  const router = useRouter();
  const [tab, setTab] = useState('bookings');
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');
  const saved = destinations.slice(0, 3);

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cliente/bookings')
      .then(async (res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          router.push('/auth/login');
          return null;
        }
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error || 'No se pudo cargar tu información.');
        return null;
      })
      .then((json) => {
        if (!json) return;
        setClient(json.client);
        setBookings(json.bookings || []);
        setQuotes(json.quotes || []);
      })
      .catch(() => setErrorMessage('No se pudo cargar tu información.'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/cliente/logout', { method: 'POST' });
    router.push('/auth/login');
  }

  const totalInvertido = quotes.reduce((sum, q) => sum + (q.invoice?.amountPaid || 0), 0);
  const viajesCompletados = bookings.filter((b) => b.status === 'completada').length;
  const cotizacionesActivas = quotes.filter((q) => ['borrador', 'enviada', 'aceptada'].includes(q.status)).length;

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 dark:bg-navy-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 dark:bg-navy-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-navy-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center">
              <User className="w-8 h-8 text-navy-950" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-navy-950 dark:text-white">Bienvenido, {client?.name}</h1>
              <p className="text-gray-500 dark:text-white/50 text-sm">
                {client?.email} · Cliente desde {client ? new Date(client.createdAt).getFullYear() : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:text-gold-500 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:text-gold-500 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-red-500 transition-colors px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10">
              <LogOut className="w-4 h-4" />Salir
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Solicitudes enviadas', value: String(bookings.length), icon: Plane, color: 'text-blue-500' },
            { label: 'Viajes completados', value: String(viajesCompletados), icon: CheckCircle, color: 'text-green-500' },
            { label: 'Total invertido', value: formatPrice(totalInvertido), icon: CreditCard, color: 'text-gold-500' },
            { label: 'Cotizaciones activas', value: String(cotizacionesActivas), icon: FileText, color: 'text-purple-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-xl font-bold font-display text-navy-950 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-white/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${tab === t.id ? 'bg-gold-500 text-white' : 'bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'bookings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide mb-3">Mis reservas</h2>
              {bookings.length === 0 ? (
                <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-8 text-center text-sm text-gray-400">
                  Aún no tienes reservas. Explora nuestros destinos y solicita la primera.
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b, i) => (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <span className="font-mono text-xs text-gray-400 dark:text-white/40">
                            {b.type === 'quote' ? 'Solicitud de cotización' : 'Reserva'}
                          </span>
                          <h3 className="font-display font-bold text-navy-950 dark:text-white mt-1">{b.itemLabel}</h3>
                          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                            {b.date ? `Salida: ${formatDate(b.date)} · ` : ''}{b.passengers} {b.passengers === 1 ? 'persona' : 'personas'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gold-500">{formatPrice(b.total)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                        <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${BOOKING_STATUS_COLOR[b.status]}`}>
                          {bookingStatusIcon(b.status)}{BOOKING_STATUS_LABEL[b.status] || b.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide mb-3">Mis cotizaciones</h2>
              {quotes.length === 0 ? (
                <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-8 text-center text-sm text-gray-400">
                  No tienes cotizaciones todavía.
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((q, i) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <span className="font-mono text-xs text-gray-400 dark:text-white/40">COT-{String(q.number).padStart(4, '0')}</span>
                          <h3 className="font-display font-bold text-navy-950 dark:text-white mt-1">
                            {q.items.map((it) => it.description).join(', ')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">{formatDate(q.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gold-500">{formatPrice(q.total)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex-wrap">
                        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${QUOTE_STATUS_COLOR[q.status]}`}>
                          {QUOTE_STATUS_LABEL[q.status] || q.status}
                        </span>
                        {q.invoice && (
                          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-navy-950/5 dark:bg-white/10 text-navy-950 dark:text-white">
                            <Receipt className="w-3.5 h-3.5" />
                            {INVOICE_STATUS_LABEL[q.invoice.status] || q.invoice.status}
                            {q.invoice.status !== 'borrador' && q.invoice.status !== 'anulada' && (
                              <> · {formatPrice(q.invoice.amountPaid)} / {formatPrice(q.invoice.total)}</>
                            )}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'saved' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {saved.map((d) => (
              <Link key={d.id} href={`/destinos/${d.slug}`}
                className="bg-white dark:bg-navy-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm card-hover">
                <div className="relative h-36">
                  <Image src={d.image} alt={d.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
                  <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-navy-950 dark:text-white">{d.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/50">{d.country}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-gold-500 font-bold">{formatPrice(d.price)}</span>
                    <span className="text-xs text-gray-400">{d.duration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'profile' && (
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-6 max-w-lg shadow-sm">
            <h2 className="text-xl font-display font-bold text-navy-950 dark:text-white mb-6">Información personal</h2>
            <div className="space-y-4">
              {[
                { label: 'Nombre', value: client?.name || '—' },
                { label: 'Correo', value: client?.email || '—' },
                { label: 'Teléfono', value: client?.phone || 'No indicado' },
                { label: 'Cliente desde', value: client ? formatDate(client.createdAt) : '—' },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
                  <span className="text-sm text-gray-500 dark:text-white/50">{f.label}</span>
                  <span className="font-medium text-navy-950 dark:text-white">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
