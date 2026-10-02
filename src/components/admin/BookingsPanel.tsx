'use client';

import { useState } from 'react';
import { Trash2, Eye, CalendarClock, Plane, Hotel, Compass, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import { useAdminTab } from './AdminTabContext';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';

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

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-blue-100 text-blue-700',
};

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="admin-display text-2xl font-bold text-gray-900">Reservas</h2>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={bookings.length === 0}
        emptyIcon={CalendarClock}
        emptyMessage="Aún no hay reservas ni cotizaciones desde la web."
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Ítem</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => {
              const ItemIcon = ITEM_ICON[b.itemType] || Plane;
              return (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{b.customerName}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <ItemIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {b.itemLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {b.type === 'quote' ? 'Cotización' : 'Reserva'}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-500">{b.date ? formatDate(b.date) : '—'}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{formatPrice(b.total)}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={b.status}
                      onChange={(e) => changeStatus(b, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-gold-500/40 ${STATUS_COLOR[b.status]}`}
                    >
                      {Object.keys(STATUS_LABEL).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {b.type === 'booking' && !b.quote && (
                        <button
                          onClick={() => handleConvertToQuote(b)}
                          disabled={converting === b.id}
                          title="Convertir en cotización"
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-gold-600 hover:bg-gold-50 transition-all disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {converting === b.id ? '...' : 'Cotizar'}
                        </button>
                      )}
                      {b.quote && (
                        <span className="text-xs text-gray-400 font-mono px-1">COT-{String(b.quote.number).padStart(4, '0')}</span>
                      )}
                      <button onClick={() => setViewing(b)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.itemLabel ?? ''}>
        {viewing && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Cliente</span>
                <span className="font-medium text-gray-900">{viewing.customerName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Correo</span>
                <span className="font-medium text-gray-900">{viewing.customerEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Teléfono</span>
                <span className="font-medium text-gray-900">{viewing.customerPhone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Pasajeros</span>
                <span className="font-medium text-gray-900">{viewing.passengers}</span>
              </div>
              {viewing.date && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium text-gray-900">{formatDate(viewing.date)}</span>
                </div>
              )}
              {viewing.notes && (
                <p className="text-xs text-gray-500 italic pt-2">"{viewing.notes}"</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(viewing.total)}</span>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
