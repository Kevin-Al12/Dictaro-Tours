'use client';

import { useState } from 'react';
import { Plus, Trash2, FileText, Eye, PlusCircle, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import { useAdminTab } from './AdminTabContext';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  description: string;
  price: number;
}

interface QuoteItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Quote {
  id: string;
  number: number;
  status: string;
  total: number;
  notes: string | null;
  createdAt: string;
  client: Client;
  items: QuoteItem[];
}

interface DraftItem {
  productId: string;
  description: string;
  unitPrice: string;
  quantity: string;
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  vencida: 'Vencida',
};

const STATUS_COLOR: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  enviada: 'bg-blue-100 text-blue-600',
  aceptada: 'bg-green-100 text-green-600',
  vencida: 'bg-red-100 text-red-600',
};

const emptyItem = (): DraftItem => ({ productId: '', description: '', unitPrice: '', quantity: '1' });

export default function QuotesPanel() {
  const { data: quotes, loading, reload } = useAdminList<Quote>('/api/admin/quotes', 'quotes');
  const { data: clients } = useAdminList<Client>('/api/admin/clients', 'clients');
  const { data: products } = useAdminList<Product>('/api/admin/products', 'products');
  const { setTab } = useAdminTab();

  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  function openNew() {
    setClientId('');
    setNotes('');
    setItems([emptyItem()]);
    setModalOpen(true);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function pickProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(index, {
      productId,
      description: product?.description || '',
      unitPrice: product ? String(product.price) : items[index].unitPrice,
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const draftTotal = items.reduce((sum, it) => {
    const price = parseFloat(it.unitPrice) || 0;
    const qty = parseInt(it.quantity, 10) || 0;
    return sum + price * qty;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error('Selecciona un cliente');
      return;
    }
    const validItems = items.filter((it) => it.description.trim() && parseFloat(it.unitPrice) >= 0);
    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto o servicio');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/admin/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        notes,
        items: validItems.map((it) => ({
          productId: it.productId || undefined,
          description: it.description,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Error al crear la cotización');
      return;
    }
    toast.success('Cotización creada');
    setModalOpen(false);
    reload();
  }

  async function changeStatus(quote: Quote, status: string) {
    const res = await fetch(`/api/admin/quotes/${quote.id}`, {
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

  async function handleDelete(quote: Quote) {
    const ok = await deleteAdminItem(`/api/admin/quotes/${quote.id}`, `¿Eliminar la cotización COT-${String(quote.number).padStart(4, '0')}?`);
    if (!ok) return;
    toast.success('Cotización eliminada');
    reload();
  }

  async function handleConvert(quote: Quote) {
    setConverting(quote.id);
    const res = await fetch(`/api/admin/quotes/${quote.id}/convert`, { method: 'POST' });
    setConverting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'No se pudo convertir la cotización');
      return;
    }
    toast.success('Factura creada en borrador');
    reload();
    setTab('invoices');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Cotizaciones</h2>
        <button onClick={openNew} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />Nueva cotización
        </button>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={quotes.length === 0}
        emptyIcon={FileText}
        emptyMessage={
          clients.length === 0
            ? 'Primero agrega un cliente en la pestaña Clientes, luego crea tu primera cotización.'
            : 'Aún no hay cotizaciones. Crea la primera.'
        }
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">N°</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">COT-{String(q.number).padStart(4, '0')}</td>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{q.client.name}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{formatDate(q.createdAt)}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{formatPrice(q.total)}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={q.status}
                    onChange={(e) => changeStatus(q, e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-gold-500/40 ${STATUS_COLOR[q.status]}`}
                  >
                    {Object.keys(STATUS_LABEL).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    {q.status === 'aceptada' && (
                      <button
                        onClick={() => handleConvert(q)}
                        disabled={converting === q.id}
                        title="Convertir a factura"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-gold-600 hover:bg-gold-50 transition-all disabled:opacity-50"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        {converting === q.id ? '...' : 'Facturar'}
                      </button>
                    )}
                    <button onClick={() => setViewing(q)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(q)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      {/* New quote builder */}
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva cotización" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente</label>
            <select required value={clientId} onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 appearance-none">
              <option value="">Selecciona un cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Productos y servicios</label>
              <button type="button" onClick={() => setItems([...items, emptyItem()])}
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <PlusCircle className="w-3.5 h-3.5" />Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex-1 space-y-2">
                    <select value={item.productId} onChange={(e) => pickProduct(i, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gold-500 appearance-none">
                      <option value="">— Producto libre (escribir abajo) —</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.description} · {formatPrice(p.price)}</option>)}
                    </select>
                    <input required value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Descripción"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
                    <div className="flex gap-2">
                      <input required type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
                        placeholder="Precio"
                        className="w-1/2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
                      <input required type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })}
                        placeholder="Cant."
                        className="w-1/2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones, vigencia, etc."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatPrice(draftTotal)}</span>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Crear cotización'}
          </button>
        </form>
      </AdminModal>

      {/* View quote detail */}
      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? (
          <div>
            <div>COT-{String(viewing.number).padStart(4, '0')}</div>
            <p className="text-sm font-normal text-gray-500 mt-0.5">
              {viewing.client.name} · {formatDate(viewing.createdAt)}
            </p>
          </div>
        ) : ''}
      >
        {viewing && (
          <>
            <div className="space-y-2 mb-4">
              {viewing.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-600">{it.description} × {it.quantity}</span>
                  <span className="font-medium text-gray-900">{formatPrice(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {viewing.notes && (
              <p className="text-xs text-gray-500 mb-4 italic">"{viewing.notes}"</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(viewing.total)}</span>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
