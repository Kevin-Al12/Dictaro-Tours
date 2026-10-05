'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAdminTab } from '@/components/admin/AdminTabContext';
import { hasFullAccess } from '@/lib/adminRoleConstants';
import { formatPrice, formatDate } from '@/lib/utils';
import ProductsPanel from '@/components/admin/ProductsPanel';
import ClientsPanel from '@/components/admin/ClientsPanel';
import QuotesPanel from '@/components/admin/QuotesPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import DestinationsPanel from '@/components/admin/DestinationsPanel';
import InvoicesPanel from '@/components/admin/InvoicesPanel';
import ReceivablesPanel from '@/components/admin/ReceivablesPanel';
import CompanySettingsPanel from '@/components/admin/CompanySettingsPanel';
import AppearancePanel from '@/components/admin/AppearancePanel';
import SalesBoardPanel from '@/components/admin/SalesBoardPanel';
import CalendarPanel from '@/components/admin/CalendarPanel';
import VouchersPanel from '@/components/admin/VouchersPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import DgiiPanel from '@/components/admin/DgiiPanel';
import UsersPanel from '@/components/admin/UsersPanel';
import { PageHeader } from '@/components/admin/ui';
import DonutChart from '@/components/admin/charts/DonutChart';
import Sparkline from '@/components/admin/charts/Sparkline';

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';

interface DashboardBooking {
  id: string;
  itemLabel: string;
  customerName: string;
  date: string | null;
  total: number;
  status: string;
  createdAt: string;
}

interface QuoteRef {
  id: string;
  number: number;
  clientName: string;
  total: number;
}

interface DashboardData {
  clientCount: number;
  quoteCount: number;
  bookingCount: number;
  pendingQuoteCount: number;
  openQuoteTotal: number;
  recentBookings: DashboardBooking[];
  bookingsByStatus: { status: string; count: number }[];
  quoteTrend: { date: string; count: number; total: number }[];
  acceptedQuoteRate: { accepted: number; total: number; rate: number };
  upcomingBookings: { id: string; customerName: string; itemLabel: string; date: string; passengers: number; status: string }[];
  acceptedNotInvoiced: QuoteRef[];
  staleQuotes: (QuoteRef & { daysWaiting: number })[];
  passportAlerts: { id: string; name: string; passportExpiry: string; tripLabel: string; tripDate: string | null }[];
  finance: {
    profitThisMonth: number;
    marginThisMonth: number;
    invoicedThisMonth: number;
    invoicedLastMonth: number;
    receivableTotal: number;
    overdueTotal: number;
    overdueInvoices: { id: string; number: number | null; clientName: string; balance: number; daysLate: number }[];
  } | null;
}

interface AdminIdentity {
  name: string;
  role: string;
}

// Fecha límite de la e-CF para pequeños y micro contribuyentes (Ley 32-23, prórroga DGII de mayo 2026).
const ECF_DEADLINE = new Date(2026, 10, 15);

const STATUS_ORDER = ['pendiente', 'confirmada', 'cancelada', 'completada'];
const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
};
const STATUS_HEX: Record<string, string> = {
  pendiente: '#d18a00',
  confirmada: '#17804a',
  cancelada: '#b4232f',
  completada: '#2a5bb8',
};
const STATUS_TONE: Record<string, Tone> = {
  pendiente: 'warn',
  confirmada: 'ok',
  cancelada: 'bad',
  completada: 'info',
};

const quoteCode = (n: number) => `COT-${String(n).padStart(4, '0')}`;
const invoiceCode = (n: number | null) => (n ? `FAC-${String(n).padStart(4, '0')}` : 'Factura');

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function daysUntil(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// `date` llega como "AAAA-MM-DD"; se arma en hora local para que no se corra un día por la zona horaria.
function shortDate(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className="admin-pill" data-tone={tone}>{children}</span>;
}

function CardHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
      <h2 className="text-[14.5px] font-bold">{title}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-[12.5px] font-semibold" style={{ color: 'var(--a-info)' }}>
      {children}
    </button>
  );
}

function Kpi({ label, value, extra, extraTone, chart }: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  extraTone?: 'up' | 'down';
  chart?: React.ReactNode;
}) {
  return (
    <div className="admin-card flex flex-col gap-1 px-4 py-3.5">
      <span className="text-xs font-semibold" style={{ color: 'var(--a-muted)' }}>{label}</span>
      <span className="admin-display admin-num break-words text-xl font-bold sm:text-2xl">{value}</span>
      {extra && (
        <span
          className="text-xs font-semibold"
          style={{ color: extraTone === 'up' ? 'var(--a-ok)' : extraTone === 'down' ? 'var(--a-bad)' : 'var(--a-muted)' }}
        >
          {extra}
        </span>
      )}
      {chart}
    </div>
  );
}

interface Task {
  key: string;
  tone: Tone;
  title: string;
  detail: string;
  action: string;
  tab: string;
}

function buildTasks(d: DashboardData): Task[] {
  const tasks: Task[] = [];
  for (const inv of d.finance?.overdueInvoices ?? []) {
    tasks.push({
      key: `overdue-${inv.id}`,
      tone: 'bad',
      title: `${invoiceCode(inv.number)} vencida hace ${inv.daysLate} ${inv.daysLate === 1 ? 'día' : 'días'}`,
      detail: `${inv.clientName} · saldo ${formatPrice(inv.balance)}`,
      action: 'Ver cobros',
      tab: 'receivables',
    });
  }
  for (const b of d.upcomingBookings.filter((b) => daysUntil(b.date) <= 3)) {
    const days = daysUntil(b.date);
    tasks.push({
      key: `trip-${b.id}`,
      tone: 'info',
      title: `${days === 0 ? 'Sale hoy' : days === 1 ? 'Sale mañana' : `Sale en ${days} días`}: ${b.customerName}`,
      detail: `${b.itemLabel} · ${b.passengers} ${b.passengers === 1 ? 'pasajero' : 'pasajeros'}`,
      action: 'Ver reserva',
      tab: 'bookings',
    });
  }
  for (const c of d.passportAlerts ?? []) {
    tasks.push({
      key: `passport-${c.id}`,
      tone: 'warn',
      title: `Pasaporte de ${c.name} vence el ${new Date(c.passportExpiry).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      detail: c.tripDate ? `Tiene viaje el ${shortDate(c.tripDate)}: ${c.tripLabel}` : c.tripLabel,
      action: 'Ver cliente',
      tab: 'clients',
    });
  }
  for (const q of d.staleQuotes) {
    tasks.push({
      key: `stale-${q.id}`,
      tone: 'warn',
      title: `${quoteCode(q.number)} sin respuesta hace ${q.daysWaiting} días`,
      detail: `${q.clientName} · ${formatPrice(q.total)}`,
      action: 'Dar seguimiento',
      tab: 'quotes',
    });
  }
  for (const q of d.acceptedNotInvoiced) {
    tasks.push({
      key: `accepted-${q.id}`,
      tone: 'ok',
      title: `Cotización aceptada: ${q.clientName}`,
      detail: `${quoteCode(q.number)} · ${formatPrice(q.total)} · lista para facturar`,
      action: 'Facturar',
      tab: 'quotes',
    });
  }
  return tasks;
}

function Dashboard({ me }: { me: AdminIdentity | null }) {
  const { setTab } = useAdminTab();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateLine = now.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return <p className="py-6 text-center text-sm" style={{ color: 'var(--a-faint)' }}>Cargando…</p>;
  }
  if (!data) {
    return <p className="py-6 text-center text-sm" style={{ color: 'var(--a-faint)' }}>No se pudieron cargar los datos del inicio.</p>;
  }

  const tasks = buildTasks(data);
  const urgent = tasks.filter((t) => t.tone === 'bad').length;
  const fin = data.finance;
  const monthDelta = fin && fin.invoicedLastMonth > 0
    ? Math.round(((fin.invoicedThisMonth - fin.invoicedLastMonth) / fin.invoicedLastMonth) * 100)
    : null;
  const ecfDaysLeft = Math.ceil((ECF_DEADLINE.getTime() - now.getTime()) / 86_400_000);
  const trendTotal = data.quoteTrend.reduce((sum, d) => sum + d.count, 0);

  const summary = [
    `${data.upcomingBookings.length} ${data.upcomingBookings.length === 1 ? 'salida' : 'salidas'} en los próximos 14 días`,
    `${tasks.length} ${tasks.length === 1 ? 'pendiente' : 'pendientes'} por atender`,
  ].join(' · ');

  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <h1 className="admin-display text-[23px] font-bold sm:text-[28px]">
          {greeting(now)}{me ? `, ${me.name}` : ''}
        </h1>
        <p className="first-letter:uppercase" style={{ color: 'var(--a-muted)' }}>{dateLine} · {summary}</p>
      </div>

      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {fin ? (
          <>
            <Kpi
              label="Facturado este mes"
              value={formatPrice(fin.invoicedThisMonth)}
              extra={monthDelta === null ? 'Sin datos del mes anterior' : `${monthDelta >= 0 ? '▲' : '▼'} ${Math.abs(monthDelta)}% vs. mes anterior`}
              extraTone={monthDelta === null ? undefined : monthDelta >= 0 ? 'up' : 'down'}
            />
            <Kpi
              label="Por cobrar"
              value={formatPrice(fin.receivableTotal)}
              extra={fin.overdueTotal > 0 ? `${formatPrice(fin.overdueTotal)} vencido` : 'Nada vencido'}
              extraTone={fin.overdueTotal > 0 ? 'down' : 'up'}
            />
          </>
        ) : (
          <>
            <Kpi label="Reservas" value={data.bookingCount} extra="Recibidas desde la web" />
            <Kpi label="Clientes" value={data.clientCount} extra="Registrados en el sistema" />
          </>
        )}
        <Kpi
          label="Cotizaciones abiertas"
          value={<>{data.pendingQuoteCount} <small className="text-[13px] font-medium" style={{ color: 'var(--a-muted)', fontFamily: 'var(--a-font-body)' }}>{formatPrice(data.openQuoteTotal)}</small></>}
          extra={data.staleQuotes.length > 0 ? `${data.staleQuotes.length} sin respuesta hace 5+ días` : 'Todas al día'}
        />
{fin ? (
          <Kpi
            label="Ganancia del mes"
            value={<>{formatPrice(fin.profitThisMonth)} <small className="text-[13px] font-medium" style={{ color: 'var(--a-muted)', fontFamily: 'var(--a-font-body)' }}>{fin.marginThisMonth}% margen</small></>}
            extra="Precio al cliente menos costo del proveedor"
          />
        ) : (
        <Kpi
          label="Cotizaciones · 14 días"
          value={trendTotal}
          extra={`${data.acceptedQuoteRate.rate}% aceptadas en total`}
          chart={trendTotal > 0 && (
            <div className="h-[30px] w-full overflow-hidden">
              <Sparkline data={data.quoteTrend.map((d) => ({ date: d.date, value: d.count }))} width={200} height={30} />
            </div>
          )}
        />
        )}
      </section>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="admin-card">
          <CardHeader
            title={<span className="flex items-center gap-2">Lo que toca hoy {urgent > 0 && <Pill tone="bad">{urgent} {urgent === 1 ? 'urgente' : 'urgentes'}</Pill>}</span>}
          />
          {tasks.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-6" style={{ color: 'var(--a-muted)' }}>
              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--a-ok)' }} />
              Todo al día. No hay cobros vencidos, salidas cercanas ni cotizaciones esperando.
            </div>
          ) : (
            <div>
              {tasks.map((t) => (
                <div key={t.key} className="grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--a-line)' }}>
                  <span className="admin-stripe" data-tone={t.tone} />
                  <div className="min-w-0">
                    <b className="block font-semibold">{t.title}</b>
                    <small className="block truncate" style={{ color: 'var(--a-muted)' }}>{t.detail}</small>
                  </div>
                  <button type="button" className="admin-btn" data-size="sm" onClick={() => setTab(t.tab)}>{t.action}</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-card">
          <CardHeader title="Próximas salidas" action={<LinkButton onClick={() => setTab('bookings')}>Todas →</LinkButton>} />
          {data.upcomingBookings.length === 0 ? (
            <p className="px-4 py-6 text-sm" style={{ color: 'var(--a-muted)' }}>No hay salidas en los próximos 14 días.</p>
          ) : (
            <div>
              {data.upcomingBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
                  <span className="admin-num w-14 shrink-0 text-[13px]" style={{ color: 'var(--a-muted)' }}>{shortDate(b.date)}</span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[13px]">{b.customerName}</b>
                    <small className="block truncate" style={{ color: 'var(--a-muted)' }}>{b.itemLabel}</small>
                  </div>
                  <Pill tone={STATUS_TONE[b.status] ?? 'mute'}>{STATUS_LABEL[b.status] ?? b.status}</Pill>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <section className="admin-card">
          <CardHeader title="Reservas por estado" />
          <div className="px-4 py-4">
            <DonutChart
              data={STATUS_ORDER.map((s) => ({
                label: STATUS_LABEL[s],
                value: data.bookingsByStatus.find((b) => b.status === s)?.count || 0,
                color: STATUS_HEX[s],
              }))}
            />
          </div>
        </section>

        {fin ? (
          <section className="admin-card">
            <CardHeader title="Facturación electrónica" action={<Pill tone="warn">Pendiente</Pill>} />
            <div className="flex flex-col gap-2.5 px-4 py-4">
              <p style={{ color: 'var(--a-muted)' }}>
                Los e-CF son obligatorios desde el <b style={{ color: 'var(--a-fg)' }}>15 de noviembre de 2026</b>
                {ecfDaysLeft > 0 && <>. Faltan <b style={{ color: 'var(--a-fg)' }}>{ecfDaysLeft} días</b></>}.
              </p>
              {['Certificado digital para firmar (proveedor autorizado por INDOTEL)', 'Habilitación como emisor en la Oficina Virtual de la DGII', 'Conectar el proveedor de e-CF certificado', 'Pruebas de certificación'].map((step) => (
                <div key={step} className="flex items-center gap-2 text-sm">
                  <Pill tone="mute">Pendiente</Pill>
                  <span>{step}</span>
                </div>
              ))}
              <p className="text-xs" style={{ color: 'var(--a-faint)' }}>
                Mientras tanto, las facturas que se emiten aquí son de control interno.
              </p>
            </div>
          </section>
        ) : (
          <section className="admin-card">
            <CardHeader title="Reservas recientes" action={<LinkButton onClick={() => setTab('bookings')}>Ver todas →</LinkButton>} />
            <RecentBookings bookings={data.recentBookings} />
          </section>
        )}
      </div>

      {fin && (
        <section className="admin-card">
          <CardHeader title="Reservas recientes" action={<LinkButton onClick={() => setTab('bookings')}>Ver todas →</LinkButton>} />
          <RecentBookings bookings={data.recentBookings} />
        </section>
      )}
    </div>
  );
}

function RecentBookings({ bookings }: { bookings: DashboardBooking[] }) {
  if (bookings.length === 0) {
    return <p className="px-4 py-6 text-sm" style={{ color: 'var(--a-muted)' }}>Todavía no hay reservas ni cotizaciones enviadas desde la web.</p>;
  }
  return (
    <div>
      {bookings.map((b) => (
        <div key={b.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[13px]">{b.customerName}</b>
            <small className="block truncate" style={{ color: 'var(--a-muted)' }}>{b.itemLabel}</small>
          </div>
          <span className="admin-num hidden shrink-0 whitespace-nowrap text-right text-xs sm:block" style={{ color: 'var(--a-faint)' }}>
            {formatDate(b.date || b.createdAt)}
          </span>
          <span className="admin-num w-24 shrink-0 text-right text-sm font-semibold">{formatPrice(b.total)}</span>
          <Pill tone={STATUS_TONE[b.status] ?? 'mute'}>{STATUS_LABEL[b.status] ?? b.status}</Pill>
        </div>
      ))}
    </div>
  );
}

function Settings({ me }: { me: AdminIdentity | null }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader title="Configuración" subtitle="Empresa, apariencia y seguridad." />
      <AppearancePanel />
      {hasFullAccess(me?.role) && <CompanySettingsPanel />}
      {hasFullAccess(me?.role) && <UsersPanel />}
    </div>
  );
}

export default function AdminPage() {
  const { tab } = useAdminTab();
  const [me, setMe] = useState<AdminIdentity | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setMe(json?.admin ?? null))
      .catch(() => setMe(null));
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-5 sm:px-7 sm:pt-6">
      {tab === 'dashboard' && <Dashboard me={me} />}
      {tab === 'packages' && <DestinationsPanel />}
      {tab === 'products' && <ProductsPanel />}
      {tab === 'clients' && <ClientsPanel />}
      {tab === 'quotes' && <QuotesPanel />}
      {tab === 'bookings' && <BookingsPanel />}
      {tab === 'invoices' && <InvoicesPanel />}
      {tab === 'receivables' && <ReceivablesPanel />}
      {tab === 'settings' && <Settings me={me} />}
      {tab === 'sales' && <SalesBoardPanel />}
      {tab === 'calendar' && <CalendarPanel />}
      {tab === 'vouchers' && <VouchersPanel />}
      {tab === 'reports' && <ReportsPanel />}
      {tab === 'dgii' && <DgiiPanel />}
    </main>
  );
}
