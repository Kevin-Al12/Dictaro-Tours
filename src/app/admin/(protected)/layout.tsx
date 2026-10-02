'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Plane, Users, Tag, BarChart3,
  FileText, Package, LogOut, MessageCircle, Receipt, Landmark, Settings,
} from 'lucide-react';
import { AdminTabProvider, useAdminTab } from '@/components/admin/AdminTabContext';
import { hasFullAccess } from '@/lib/adminRoleConstants';

interface AdminIdentity {
  name: string;
  email: string;
  role: string;
}

const generalTabs = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'packages',    label: 'Paquetes',     icon: Plane },
  { id: 'bookings',    label: 'Reservas',     icon: Users },
  { id: 'promotions',  label: 'Promociones',  icon: Tag },
  { id: 'stats',       label: 'Estadísticas', icon: BarChart3 },
];

const billingTabs = [
  { id: 'products',  label: 'Productos y Servicios', icon: Package },
  { id: 'clients',   label: 'Clientes',               icon: Users },
  { id: 'quotes',    label: 'Cotizaciones',            icon: FileText },
  { id: 'invoices',  label: 'Facturas',                icon: Receipt },
];

// Solo visibles para owner/admin (la API también lo exige, esto es nada más el filtro de UI).
const restrictedBillingTabs = [
  { id: 'receivables',      label: 'Cuentas por Cobrar', icon: Landmark },
  { id: 'company-settings', label: 'Configuración',      icon: Settings },
];

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  packages: 'Paquetes',
  bookings: 'Reservas',
  promotions: 'Promociones',
  stats: 'Estadísticas',
  products: 'Productos y Servicios',
  clients: 'Clientes',
  quotes: 'Cotizaciones',
  invoices: 'Facturas',
  receivables: 'Cuentas por Cobrar',
  'company-settings': 'Configuración de la empresa',
};

function NavButton({ id, label, icon: Icon }: { id: string; label: string; icon: typeof Plane }) {
  const { tab, setTab } = useAdminTab();
  const active = tab === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-all ${
        active ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

function Sidebar({ role }: { role: string | undefined }) {
  const fullAccess = hasFullAccess(role);
  return (
    <aside className="w-full lg:w-56 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 lg:h-screen lg:sticky lg:top-0 flex flex-col">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100 shrink-0">
        <div className="relative w-8 h-8 shrink-0 bg-white rounded-full p-0.5 shadow ring-1 ring-gray-200">
          <Image src="/images/logo.png" alt="D'Itaros Tours" fill className="object-contain rounded-full" />
        </div>
        <span className="text-sm font-display font-bold text-gray-900 leading-tight">D'Itaros Tours</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div className="space-y-0.5">
          {generalTabs.map((t) => <NavButton key={t.id} {...t} />)}
        </div>
        <div>
          <p className="px-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Facturación
          </p>
          <div className="space-y-0.5">
            {billingTabs.map((t) => <NavButton key={t.id} {...t} />)}
            {fullAccess && restrictedBillingTabs.map((t) => <NavButton key={t.id} {...t} />)}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-gray-100 shrink-0">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-center">
          <MessageCircle className="w-5 h-5 text-gold-500 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-gray-900 mb-0.5">¿Necesitas ayuda?</p>
          <p className="text-[11px] text-gray-500 mb-2">Escríbenos por WhatsApp</p>
          <a
            href="https://wa.me/18095551234"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-xs font-semibold bg-gold-500 hover:bg-gold-600 text-white rounded-md py-1.5 transition-colors"
          >
            Contactar
          </a>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ me, onLogout }: { me: AdminIdentity | null; onLogout: () => void }) {
  const { tab } = useAdminTab();
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
      <h1 className="text-lg font-semibold text-gray-900">{TAB_TITLES[tab] || 'Panel'}</h1>
      <div className="flex items-center gap-3">
        {me && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {me.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 leading-tight">{me.name}</p>
              <p className="text-xs text-gray-400 capitalize">{me.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<AdminIdentity | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data?.admin ?? null))
      .catch(() => setMe(null));
  }, []);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar role={me?.role} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar me={me} onLogout={handleLogout} />
        {children}
      </div>
    </div>
  );
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminTabProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminTabProvider>
  );
}
