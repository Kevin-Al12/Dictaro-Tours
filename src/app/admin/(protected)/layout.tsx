'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, CalendarCheck, Plane, FileText, Receipt, Landmark,
  Users, Package, Settings, LogOut, Menu, Search, Plus, KanbanSquare, CalendarDays, Ticket, BarChart3, Building2, type LucideIcon,
} from 'lucide-react';
import { AdminTabProvider, useAdminTab } from '@/components/admin/AdminTabContext';
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/AdminThemeContext';
import CommandPalette, { type PaletteItem } from '@/components/admin/CommandPalette';
import { hasFullAccess } from '@/lib/adminRoleConstants';
import '../admin.css';

interface AdminIdentity {
  name: string;
  email: string;
  role: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  // Solo visibles para owner/admin (la API también lo exige, esto es nada más el filtro de UI).
  fullAccessOnly?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Día a día',
    items: [
      { id: 'dashboard', label: 'Inicio', icon: Home },
      { id: 'sales', label: 'Ventas', icon: KanbanSquare },
      { id: 'calendar', label: 'Calendario', icon: CalendarDays },
      { id: 'bookings', label: 'Reservas', icon: CalendarCheck },
      { id: 'packages', label: 'Destinos y paquetes', icon: Plane },
    ],
  },
  {
    section: 'Dinero',
    items: [
      { id: 'quotes', label: 'Cotizaciones', icon: FileText },
      { id: 'invoices', label: 'Facturas', icon: Receipt },
      { id: 'receivables', label: 'Cobros', icon: Landmark, fullAccessOnly: true },
      { id: 'vouchers', label: 'Vouchers', icon: Ticket },
    ],
  },
  {
    section: 'Catálogo',
    items: [
      { id: 'clients', label: 'Clientes', icon: Users },
      { id: 'products', label: 'Productos y servicios', icon: Package },
    ],
  },
  {
    section: 'Control',
    items: [
      { id: 'reports', label: 'Reportes', icon: BarChart3, fullAccessOnly: true },
      { id: 'dgii', label: 'Impuestos DGII', icon: Building2, fullAccessOnly: true },
      { id: 'settings', label: 'Configuración', icon: Settings },
    ],
  },
];

// Nombres formales de los roles para mostrar en pantalla.
const ROLE_LABEL: Record<string, string> = {
  owner: 'Administradora',
  admin: 'Administración',
  vendedor: 'Ventas',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function Sidebar({ me, open, onLogout }: { me: AdminIdentity | null; open: boolean; onLogout: () => void }) {
  const { tab, setTab } = useAdminTab();
  const fullAccess = hasFullAccess(me?.role);

  return (
    <aside
      aria-label="Menú principal"
      className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col gap-5 overflow-y-auto px-3 py-[18px] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-[232px] lg:translate-x-0 ${
        open ? 'translate-x-0 shadow-[0_0_0_100vmax_rgba(0,0,0,.4)] lg:shadow-none' : '-translate-x-full'
      }`}
      style={{ background: 'var(--a-navy)', color: 'var(--a-navy-fg)' }}
    >
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#c41e2c] text-[19px] font-bold text-white admin-display">
          D&apos;
        </div>
        <div className="min-w-0">
          <b className="admin-display block text-base leading-tight">D&apos;Itaros Tours</b>
          <small className="text-[11px]" style={{ color: 'var(--a-navy-muted)' }}>Panel de la agencia</small>
        </div>
      </div>

      <nav className="flex flex-col gap-4">
        {NAV.map((group) => {
          const items = group.items.filter((it) => !it.fullAccessOnly || fullAccess);
          if (items.length === 0) return null;
          return (
            <div key={group.section} className="flex flex-col gap-0.5">
              <span className="px-2.5 pb-1 text-[10.5px] uppercase tracking-[0.09em]" style={{ color: 'var(--a-navy-muted)' }}>
                {group.section}
              </span>
              {items.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-white/[.06] ${
                      active ? 'bg-white/[.11] font-semibold opacity-100' : 'opacity-[.82] hover:opacity-100'
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-white/[.08] px-2 pt-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3f66a9] text-xs font-bold text-white">
          {me ? initials(me.name) : '·'}
        </div>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[13px]">{me?.name ?? ' '}</b>
          <small className="block text-[11px]" style={{ color: 'var(--a-navy-muted)' }}>
            {me ? ROLE_LABEL[me.role] ?? 'Rol no válido' : ''}
          </small>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="rounded-lg p-1.5 opacity-80 transition-colors hover:bg-white/[.08] hover:opacity-100"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { setTab } = useAdminTab();
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 sm:px-7 sm:py-3.5"
      style={{ background: 'var(--a-surface)', borderBottom: '1px solid var(--a-line)' }}
    >
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menú"
        className="rounded-lg p-1.5 lg:hidden"
        style={{ border: '1px solid var(--a-line)' }}
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onSearch}
        className="flex max-w-[460px] flex-1 items-center gap-2 rounded-[9px] px-3 py-[7px] text-left text-sm"
        style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)', color: 'var(--a-faint)' }}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar sección o acción…</span>
        <kbd
          className="ml-auto hidden rounded-[5px] px-1.5 font-mono text-[11px] sm:inline"
          style={{ border: '1px solid var(--a-line)', background: 'var(--a-surface)' }}
        >
          Ctrl K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="admin-btn" data-variant="primary" aria-label="Nueva cotización" onClick={() => setTab('quotes')}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva cotización</span>
        </button>
      </div>
    </header>
  );
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tab, setTab } = useAdminTab();
  const { theme } = useAdminTheme();
  const [me, setMe] = useState<AdminIdentity | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data?.admin ?? null))
      .catch(() => setMe(null));
  }, []);

  // Al cambiar de sección en el celular, se cierra el menú lateral.
  useEffect(() => setMenuOpen(false), [tab]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const fullAccess = hasFullAccess(me?.role);
    const sections = NAV.flatMap((group) =>
      group.items
        .filter((it) => !it.fullAccessOnly || fullAccess)
        .map((it) => ({ id: `go-${it.id}`, label: it.label, section: 'Ir a', hint: group.section, run: () => setTab(it.id) })),
    );
    const actions: PaletteItem[] = [
      { id: 'new-quote', label: 'Nueva cotización', section: 'Acciones', run: () => setTab('quotes') },
      { id: 'new-invoice', label: 'Nueva factura', section: 'Acciones', run: () => setTab('invoices') },
      { id: 'new-client', label: 'Nuevo cliente', section: 'Acciones', run: () => setTab('clients') },
      { id: 'appearance', label: 'Cambiar a modo claro u oscuro', section: 'Acciones', hint: 'Configuración', run: () => setTab('settings') },
    ];
    return [...sections, ...actions];
  }, [me?.role, setTab]);

  return (
    <div className="admin-shell min-h-screen lg:flex" data-admin-theme={theme}>
      <Sidebar me={me} open={menuOpen} onLogout={handleLogout} />
      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 cursor-default lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenuOpen(true)} onSearch={() => setPaletteOpen(true)} />
        {children}
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
    </div>
  );
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminTabProvider>
        <AdminChrome>{children}</AdminChrome>
      </AdminTabProvider>
    </AdminThemeProvider>
  );
}
