'use client';

import { useEffect, useState } from 'react';
import { BarChart3, FileText } from 'lucide-react';
import { useAdminTab } from '@/components/admin/AdminTabContext';
import { formatPrice, formatDate } from '@/lib/utils';
import ProductsPanel from '@/components/admin/ProductsPanel';
import ClientsPanel from '@/components/admin/ClientsPanel';
import QuotesPanel from '@/components/admin/QuotesPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import DestinationsPanel from '@/components/admin/DestinationsPanel';
import InvoicesPanel from '@/components/admin/InvoicesPanel';
import ReceivablesPanel from '@/components/admin/ReceivablesPanel';
import CompanySettingsPanel from '@/components/admin/CompanySettingsPanel';
import DonutChart from '@/components/admin/charts/DonutChart';
import Sparkline from '@/components/admin/charts/Sparkline';

interface DashboardBooking {
  id: string;
  itemLabel: string;
  customerName: string;
  date: string | null;
  total: number;
  status: string;
  createdAt: string;
}

interface DashboardPendingQuote {
  id: string;
  number: number;
  clientName: string;
  createdAt: string;
  total: number;
}

interface DashboardData {
  clientCount: number;
  quoteCount: number;
  bookingCount: number;
  pendingQuoteCount: number;
  quoteTotalSum: number;
  recentBookings: DashboardBooking[];
  bookingsByStatus: { status: string; count: number }[];
  pendingQuotes: DashboardPendingQuote[];
  quoteTrend: { date: string; count: number; total: number }[];
  acceptedQuoteRate: { accepted: number; total: number; rate: number };
}

const STATUS_ORDER = ['pendiente', 'confirmada', 'cancelada', 'completada'];

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
};

const STATUS_HEX: Record<string, string> = {
  pendiente: '#eab308',
  confirmada: '#22c55e',
  cancelada: '#ef4444',
  completada: '#3b82f6',
};

const STATUS_BADGE: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-blue-100 text-blue-700',
};

const AVATAR_COLORS = ['bg-brand-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-600', 'bg-orange-500'];
function avatarColor(id: string) {
  const n = parseInt(id.slice(-2), 36);
  return AVATAR_COLORS[Number.isNaN(n) ? 0 : n % AVATAR_COLORS.length];
}

export default function AdminPage() {
  const { tab, setTab } = useAdminTab();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((data) => setDashboard(data))
      .finally(() => setDashboardLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {dashboardLoading ? (
            <div className="py-6 text-center text-sm text-gray-400">Cargando...</div>
          ) : !dashboard ? (
            <div className="py-6 text-center text-sm text-gray-400">No se pudieron cargar las estadísticas.</div>
          ) : (
            <>
              {/* Row 1: tendencia, reservas por estado, cotizaciones pendientes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Cotizaciones · últimos 14 días</p>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {dashboard.quoteTrend.reduce((sum, d) => sum + d.count, 0)}
                  </div>
                  <Sparkline
                    data={dashboard.quoteTrend.map((d) => ({ date: d.date, value: d.count }))}
                    width={220}
                    height={52}
                  />
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-3">Reservas por estado</p>
                  <DonutChart
                    data={STATUS_ORDER.map((s) => ({
                      label: STATUS_LABEL[s],
                      value: dashboard.bookingsByStatus.find((b) => b.status === s)?.count || 0,
                      color: STATUS_HEX[s],
                    }))}
                  />
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Cotizaciones por resolver</p>
                    <button onClick={() => setTab('quotes')} className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors">
                      Ver todas
                    </button>
                  </div>
                  {dashboard.pendingQuotes.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">Nada pendiente</p>
                  ) : (
                    <div className="space-y-2.5">
                      {dashboard.pendingQuotes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between text-sm gap-2">
                          <div className="min-w-0">
                            <p className="text-gray-900 font-medium truncate">{q.clientName}</p>
                            <p className="text-xs text-gray-400">COT-{String(q.number).padStart(4, '0')} · {formatDate(q.createdAt)}</p>
                          </div>
                          <span className="text-gray-900 font-semibold shrink-0">{formatPrice(q.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: reservas recientes */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Reservas recientes</h3>
                  <button onClick={() => setTab('bookings')} className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors">
                    Ver historial completo
                  </button>
                </div>
                {dashboard.recentBookings.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">
                    Todavía no hay reservas ni cotizaciones enviadas desde la web.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {dashboard.recentBookings.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${avatarColor(b.id)}`}>
                          {b.customerName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                          <p className="text-xs text-gray-400 truncate">{b.itemLabel}</p>
                        </div>
                        <span className="text-xs text-gray-400 hidden sm:block w-28 text-right shrink-0">
                          {b.date ? formatDate(b.date) : formatDate(b.createdAt)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 w-24 text-right shrink-0">{formatPrice(b.total)}</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[b.status]}`}>
                          {STATUS_LABEL[b.status] || b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: tasa de conversión + accesos rápidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">Cotizaciones aceptadas</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">{dashboard.acceptedQuoteRate.rate}%</span>
                    <span className="text-xs text-gray-400">{dashboard.acceptedQuoteRate.accepted} de {dashboard.acceptedQuoteRate.total}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${dashboard.acceptedQuoteRate.rate}%` }} />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-3">Accesos rápidos</p>
                  <div className="flex gap-2">
                    <button onClick={() => setTab('packages')} className="btn-primary flex-1 justify-center text-sm py-2">
                      + Nuevo destino
                    </button>
                    <button onClick={() => setTab('quotes')} className="btn-outline flex-1 justify-center text-sm py-2">
                      + Nueva cotización
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-500">
                Total cotizado históricamente: <strong className="text-gray-900">{formatPrice(dashboard.quoteTotalSum)}</strong>.
                Esto refleja el valor de las cotizaciones creadas, no ingresos confirmados — todavía no hay un sistema de facturación/pagos conectado que calcule ingresos reales.
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'packages' && <DestinationsPanel />}

      {tab === 'products' && <ProductsPanel />}
      {tab === 'clients' && <ClientsPanel />}
      {tab === 'quotes' && <QuotesPanel />}
      {tab === 'bookings' && <BookingsPanel />}
      {tab === 'invoices' && <InvoicesPanel />}
      {tab === 'receivables' && <ReceivablesPanel />}
      {tab === 'company-settings' && <CompanySettingsPanel />}

      {(tab === 'promotions' || tab === 'stats') && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          {tab === 'promotions' ? <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" /> : <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-3" />}
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {tab === 'promotions' ? 'Gestión de Promociones' : 'Estadísticas'}
          </h3>
          <p className="text-gray-500 text-sm">Sección en desarrollo. Próximamente disponible.</p>
        </div>
      )}
    </div>
  );
}
