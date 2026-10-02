'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Receipt, Eye, PlusCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import { hasFullAccess } from '@/lib/adminRoleConstants';
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

interface InvoiceItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface InvoicePayment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  receivedAt: string;
}

interface Invoice {
  id: string;
  number: number | null;
  status: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  itbis: number;
  total: number;
  amountPaid: number;
  notes: string | null;
  voidReason: string | null;
  voidedAt: string | null;
  client: Client;
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

interface DraftItem {
  productId: string;
  description: string;
  unitPrice: string;
  quantity: string;
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  pagada_parcial: 'Pago parcial',
  pagada: 'Pagada',
  anulada: 'Anulada',
};

const STATUS_COLOR: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  emitida: 'bg-blue-100 text-blue-600',
  pagada_parcial: 'bg-yellow-100 text-yellow-700',
  pagada: 'bg-green-100 text-green-700',
  anulada: 'bg-red-100 text-red-600',
};

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'tarjeta', 'cheque'];

const emptyItem = (): DraftItem => ({ productId: '', description: '', unitPrice: '', quantity: '1' });

export default function InvoicesPanel() {
  const { data: invoices, loading, reload } = useAdminList<Invoice>('/api/admin/invoices', 'invoices');
  const { data: clients } = useAdminList<Client>('/api/admin/clients', 'clients');
  const { data: products } = useAdminList<Product>('/api/admin/products', 'products');
  const [role, setRole] = useState<string | undefined>(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  const [paymentForm, setPaymentForm] = useState({ amount: '', method: PAYMENT_METHODS[0], reference: '', notes: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRole(data?.admin?.role))
      .catch(() => setRole(undefined));
  }, []);

  function openNew() {
    setClientId('');
    setNotes('');
    setDueDate('');
    setItems([emptyItem()]);
    setModalOpen(true);
  }

  function openView(inv: Invoice) {
    setViewing(inv);
    setShowPaymentForm(false);
    setShowVoidForm(false);
    setPaymentForm({ amount: '', method: PAYMENT_METHODS[0], reference: '', notes: '' });
    setVoidReason('');
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
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        notes,
        dueDate: dueDate || undefined,
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
      toast.error(data.error || 'Error al crear la factura');
      return;
    }
    toast.success('Factura creada en borrador');
    setModalOpen(false);
    reload();
  }

  async function handleEmit(inv: Invoice) {
    setActionLoading(true);
    const res = await fetch(`/api/admin/invoices/${inv.id}/emit`, { method: 'POST' });
    setActionLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'No se pudo emitir la factura');
      return;
    }
    const data = await res.json();
    toast.success('Factura emitida');
    setViewing(data.invoice);
    reload();
  }

  async function handleDelete(inv: Invoice) {
    const ok = await deleteAdminItem(`/api/admin/invoices/${inv.id}`, '¿Eliminar esta factura en borrador?');
    if (!ok) return;
    toast.success('Factura eliminada');
    setViewing(null);
    reload();
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!viewing) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/invoices/${viewing.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentForm),
    });
    setActionLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'No se pudo registrar el pago');
      return;
    }
    const data = await res.json();
    toast.success('Pago registrado');
    setViewing(data.invoice);
    setShowPaymentForm(false);
    setPaymentForm({ amount: '', method: PAYMENT_METHODS[0], reference: '', notes: '' });
    reload();
  }

  async function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    if (!viewing || !voidReason.trim()) {
      toast.error('Indica el motivo de anulación');
      return;
    }
    setActionLoading(true);
    const res = await fetch(`/api/admin/invoices/${viewing.id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voidReason }),
    });
    setActionLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'No se pudo anular la factura');
      return;
    }
    toast.success('Factura anulada');
    setViewing(null);
    reload();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="admin-display text-2xl font-bold text-gray-900">Facturas</h2>
          <p className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-1.5 w-fit">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Facturación interna — la emisión de NCF/e-CF ante la DGII todavía no está conectada.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />Nueva factura
        </button>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={invoices.length === 0}
        emptyIcon={Receipt}
        emptyMessage="Aún no hay facturas. Crea una manual o convierte una cotización aceptada."
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">N°</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Saldo</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                  {inv.number ? `FAC-${String(inv.number).padStart(4, '0')}` : 'Borrador'}
                </td>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{inv.client.name}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{formatDate(inv.issueDate)}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{formatPrice(inv.total)}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{formatPrice(Math.max(inv.total - inv.amountPaid, 0))}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[inv.status]}`}>
                    {STATUS_LABEL[inv.status] || inv.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => openView(inv)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Nueva factura */}
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva factura" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente</label>
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 appearance-none">
                <option value="">Selecciona un cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de vencimiento</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
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
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total (ITBIS incluido)</span>
            <span className="text-lg font-bold text-gray-900">{formatPrice(draftTotal)}</span>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Crear factura en borrador'}
          </button>
        </form>
      </AdminModal>

      {/* Detalle de factura */}
      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? (
          <div>
            <div className="flex items-center gap-2">
              <span>{viewing.number ? `FAC-${String(viewing.number).padStart(4, '0')}` : 'Borrador'}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[viewing.status]}`}>
                {STATUS_LABEL[viewing.status]}
              </span>
            </div>
            <p className="text-sm font-normal text-gray-500 mt-0.5">
              {viewing.client.name} · {formatDate(viewing.issueDate)}
            </p>
          </div>
        ) : ''}
        maxWidth="max-w-lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="space-y-2">
              {viewing.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-600">{it.description} × {it.quantity}</span>
                  <span className="font-medium text-gray-900">{formatPrice(it.unitPrice * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>{formatPrice(viewing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>ITBIS</span><span>{formatPrice(viewing.itbis)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
                <span>Total</span><span>{formatPrice(viewing.total)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Pagado</span><span>{formatPrice(viewing.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Saldo pendiente</span><span>{formatPrice(Math.max(viewing.total - viewing.amountPaid, 0))}</span>
              </div>
            </div>

            {viewing.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pagos recibidos</p>
                <div className="space-y-1.5">
                  {viewing.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-gray-900 font-medium capitalize">{p.method}</span>
                        <span className="text-gray-400 text-xs ml-2">{formatDate(p.receivedAt)}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatPrice(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewing.status === 'anulada' && viewing.voidReason && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Anulada: {viewing.voidReason}
              </p>
            )}

            {/* Acciones */}
            {viewing.status === 'borrador' && (
              <div className="flex gap-2">
                <button onClick={() => handleEmit(viewing)} disabled={actionLoading} className="btn-primary flex-1 justify-center text-sm py-2 disabled:opacity-60">
                  Emitir factura
                </button>
                <button onClick={() => handleDelete(viewing)} className="flex-1 justify-center text-sm py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-semibold inline-flex items-center gap-2">
                  Eliminar
                </button>
              </div>
            )}

            {['emitida', 'pagada_parcial'].includes(viewing.status) && !showPaymentForm && (
              <button onClick={() => setShowPaymentForm(true)} className="btn-primary w-full justify-center text-sm py-2">
                Registrar pago
              </button>
            )}

            {showPaymentForm && (
              <form onSubmit={handlePayment} className="space-y-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <input required type="number" step="0.01" min="0.01" placeholder="Monto"
                    value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
                  <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 appearance-none capitalize">
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <input placeholder="Referencia (opcional)" value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
                <div className="flex gap-2">
                  <button type="submit" disabled={actionLoading} className="btn-primary flex-1 justify-center text-sm py-2 disabled:opacity-60">
                    Guardar pago
                  </button>
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="px-4 text-sm text-gray-500 hover:text-gray-900">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {hasFullAccess(role) && !['borrador', 'anulada'].includes(viewing.status) && !showVoidForm && (
              <button onClick={() => setShowVoidForm(true)} className="w-full justify-center text-sm py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-semibold inline-flex items-center gap-2">
                Anular factura
              </button>
            )}

            {showVoidForm && (
              <form onSubmit={handleVoid} className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <textarea required rows={2} placeholder="Motivo de anulación (obligatorio)"
                  value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-red-200 text-sm text-gray-900 focus:outline-none focus:border-red-400 resize-none" />
                <div className="flex gap-2">
                  <button type="submit" disabled={actionLoading} className="flex-1 justify-center text-sm py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60">
                    Confirmar anulación
                  </button>
                  <button type="button" onClick={() => setShowVoidForm(false)} className="px-4 text-sm text-gray-500 hover:text-gray-900">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
