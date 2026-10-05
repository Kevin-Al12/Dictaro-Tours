'use client';

import { useMemo, useState } from 'react';
import { Trash2, Eye, CalendarClock, Plane, Hotel, Compass, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, formatShortDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import { useAdminTab } from './AdminTabContext';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Who, StatusSelect, IconButton, FilterChips, DetailRow, Pill, type Tone } from './ui';

interface Booking {
  id: string;
  type: string;
  itemType: string;
  itemLabel: string;
  date: string | null;
  passengers: number;
  total: number;
  status: string;
  notes: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  quote: { id: string; number: number } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
};

const STATUS_TONE: Record<string, Tone> = {
  pendiente: 'warn',
  confirmada: 'ok',
  cancelada: 'bad',
  completada: 'info',
};

type Filter = 'todas' | keyof typeof STATUS_LABEL;

const ITEM_ICON: Record<string, typeof Plane> = {
  destino: Plane,
  hotel: Hotel,
  excursion: Compass,
};

export default function BookingsPanel() {
  const { data: bookings, loading, reload } = useAdminList<Booking>('/api/admin/bookings', 'bookings');
  const { setTab } = useAdminTab();
  const [viewing, setViewing] = useState<Booking | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('todas');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of bookings) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [bookings]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) =>
      (filter === 'todas' || b.status === filter) &&
      (!q || `${b.customerName} ${b.customerEmail} ${b.customerPhone} ${b.itemLabel}`.toLowerCase().includes(q)),
    );
  }, [bookings, filter, query]);

  async function changeStatus(booking: Booking, status: string) {
    const res = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('No se pudo actualizar el estado');
      return;
    }
    reload();
  }

  async function handleDelete(booking: Booking) {
    const ok = await deleteAdminItem(`/api/admin/bookings/${booking.id}`, `¿Eliminar la reserva de "${booking.customerName}"?`);
    if (!ok) return;
    toast.success('Reserva eliminada');
    reload();
  }

  async function handleConvertToQuote(booking: Booking) {
    setConverting(booking.id);
    const res = await fetch(`/api/admin/bookings/${booking.id}/convert-to-quote`, { method: 'POST' });
    setConverting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'No se pudo convertir la reserva en cotización');
      return;
    }
    toast.success('Cotización creada en borrador');
    reload();
    setTab('quotes');
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Reservas"
        subtitle={loading ? 'Cargando…' : `${bookings.length} recibidas desde la web · ${counts.pendiente ?? 0} por confirmar`}
      />

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={CalendarClock}
        emptyMessage={bookings.length === 0 ? 'Aún no hay reservas ni cotizaciones desde la web.' : 'Ninguna reserva coincide con el filtro.'}
        toolbar={
          <>
            <FilterChips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'todas', label: 'Todas', count: bookings.length },
                ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value: value as Filter, label, count: counts[value] ?? 0 })),
              ]}
            />
            <label className="relative ml-auto w-full sm:w-60">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--a-faint)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente o viaje…" aria-label="Buscar reservas" className="admin-input pl-8" />
            </label>
          </>
        }
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Viaje</th>
              <th>Fecha</th>
              <th className="r">Pax</th>
              <th className="r">Total</th>
              <th>Estado</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => {
              const ItemIcon = ITEM_ICON[b.itemType] || Plane;
              return (
                <tr key={b.id}>
                  <td><Who name={b.customerName} detail={b.customerPhone || b.customerEmail} /></td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      <ItemIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--a-faint)' }} />
                      <span className="truncate">{b.itemLabel}</span>
                    </span>
                    <span className="text-xs muted">{b.type === 'quote' ? 'Pidió cotización' : 'Reserva'}</span>
                  </td>
                  <td className="nowrap admin-num">{b.date ? formatShortDate(b.date) : <span className="muted">Sin fecha</span>}</td>
                  <td className="r admin-num">{b.passengers}</td>
                  <td className="r admin-num nowrap"><b>{formatPrice(b.total)}</b></td>
                  <td>
                    <StatusSelect label={`Estado de la reserva de ${b.customerName}`} value={b.status} options={STATUS_LABEL} tones={STATUS_TONE} onChange={(s) => changeStatus(b, s)} />
                  </td>
                  <td className="r">
                    <div className="flex items-center justify-end gap-1">
                      {b.type === 'booking' && !b.quote && (
                        <button type="button" className="admin-btn" data-size="sm" onClick={() => handleConvertToQuote(b)} disabled={converting === b.id}>
                          <FileText className="h-3.5 w-3.5" />
                          {converting === b.id ? 'Creando…' : 'Cotizar'}
                        </button>
                      )}
                      {b.quote && <Pill tone="mute">COT-{String(b.quote.number).padStart(4, '0')}</Pill>}
                      <IconButton icon={Eye} label="Ver detalle" onClick={() => setViewing(b)} />
                      <IconButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(b)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.itemLabel ?? ''}
        subtitle={viewing ? `${viewing.type === 'quote' ? 'Pidió cotización' : 'Reserva'} · recibida el ${formatDate(viewing.createdAt)}` : undefined}
      >
        {viewing && (
          <>
            <DetailRow label="Cliente">{viewing.customerName}</DetailRow>
            <DetailRow label="Correo">{viewing.customerEmail}</DetailRow>
            <DetailRow label="Teléfono">{viewing.customerPhone}</DetailRow>
            <DetailRow label="Pasajeros">{viewing.passengers}</DetailRow>
            {viewing.date && <DetailRow label="Fecha de viaje">{formatDate(viewing.date)}</DetailRow>}
            <DetailRow label="Estado"><Pill tone={STATUS_TONE[viewing.status] ?? 'mute'}>{STATUS_LABEL[viewing.status] ?? viewing.status}</Pill></DetailRow>
            {viewing.notes && <p className="pt-3 text-sm italic" style={{ color: 'var(--a-muted)' }}>&ldquo;{viewing.notes}&rdquo;</p>}
            <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--a-line)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--a-muted)' }}>Total</span>
              <span className="admin-display admin-num text-xl font-bold">{formatPrice(viewing.total)}</span>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
