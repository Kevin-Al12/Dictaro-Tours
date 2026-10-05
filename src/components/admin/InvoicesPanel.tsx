'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Receipt, Eye, PlusCircle, AlertTriangle, Search, Send, Wallet, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, formatShortDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import { hasFullAccess } from '@/lib/adminRoleConstants';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Who, Pill, IconButton, Field, FilterChips, DetailRow, type Tone } from './ui';

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

const STATUS_TONE: Record<string, Tone> = {
  borrador: 'mute',
  emitida: 'info',
  pagada_parcial: 'warn',
  pagada: 'ok',
  anulada: 'bad',
};

type Filter = 'todas' | keyof typeof STATUS_LABEL;

function invoiceCode(inv: { number: number | null }) {
  return inv.number ? `FAC-${String(inv.number).padStart(4, '0')}` : 'Borrador';
}

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
  const [filter, setFilter] = useState<Filter>('todas');
  const [query, setQuery] = useState('');

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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const inv of invoices) c[inv.status] = (c[inv.status] ?? 0) + 1;
    return c;
  }, [invoices]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) =>
      (filter === 'todas' || inv.status === filter) &&
      (!q || `${invoiceCode(inv)} ${inv.client.name}`.toLowerCase().includes(q)),
    );
  }, [invoices, filter, query]);

  const porCobrar = (counts.emitida ?? 0) + (counts.pagada_parcial ?? 0);
  const emitidas = invoices.filter((inv) => inv.number).length;
  const viewingBalance = viewing ? Math.max(viewing.total - viewing.amountPaid, 0) : 0;

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Facturas"
        subtitle={loading ? 'Cargando…' : `${emitidas} emitidas · ${porCobrar} por cobrar · ${counts.borrador ?? 0} en borrador`}
        actions={
          <button type="button" onClick={openNew} className="admin-btn" data-variant="primary">
            <Plus className="h-4 w-4" />Nueva factura
          </button>
        }
      />

      <div
        className="admin-card flex items-start gap-2.5 px-4 py-3 text-sm"
        style={{ borderLeft: '4px solid var(--a-warn)', background: 'var(--a-warn-soft)' }}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--a-warn)' }} />
        <p style={{ color: 'var(--a-fg)' }}>
          <b>Facturación interna.</b>{' '}
          <span style={{ color: 'var(--a-muted)' }}>Estas facturas son de control interno: la emisión de NCF/e-CF ante la DGII todavía no está conectada.</span>
        </p>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={Receipt}
        emptyMessage={invoices.length === 0 ? 'Aún no hay facturas. Crea una manual o convierte una cotización aceptada.' : 'Ninguna factura coincide con el filtro.'}
        emptyAction={invoices.length === 0 ? (
          <button type="button" onClick={openNew} className="admin-btn" data-variant="primary" data-size="sm">
            <Plus className="h-3.5 w-3.5" />Nueva factura
          </button>
        ) : undefined}
        toolbar={
          <>
            <FilterChips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'todas', label: 'Todas', count: invoices.length },
                ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value: value as Filter, label, count: counts[value] ?? 0 })),
              ]}
            />
            <label className="relative ml-auto w-full sm:w-60">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--a-faint)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar número o cliente…" aria-label="Buscar facturas" className="admin-input pl-8" />
            </label>
          </>
        }
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th className="r">Total</th>
              <th className="r">Saldo</th>
              <th>Estado</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((inv) => {
              const balance = Math.max(inv.total - inv.amountPaid, 0);
              return (
                <tr key={inv.id}>
                  <td className="nowrap admin-num">
                    {inv.number ? <b>{invoiceCode(inv)}</b> : <span className="muted">Borrador</span>}
                  </td>
                  <td><Who name={inv.client.name} detail={inv.dueDate ? `Vence ${formatShortDate(inv.dueDate)}` : undefined} /></td>
                  <td className="nowrap admin-num">{formatShortDate(inv.issueDate)}</td>
                  <td className="r admin-num nowrap"><b>{formatPrice(inv.total)}</b></td>
                  <td className="r admin-num nowrap" style={balance > 0 && inv.status !== 'anulada' ? { color: 'var(--a-bad)' } : { color: 'var(--a-muted)' }}>
                    {formatPrice(balance)}
                  </td>
                  <td><Pill tone={STATUS_TONE[inv.status] ?? 'mute'}>{STATUS_LABEL[inv.status] ?? inv.status}</Pill></td>
                  <td className="r">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon={Eye} label="Ver factura" onClick={() => openView(inv)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Nueva factura */}
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva factura" subtitle="Se crea en borrador; podrás emitirla después." maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Cliente">
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="admin-input">
                <option value="">Selecciona un cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Fecha de vencimiento">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="admin-input" />
            </Field>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="admin-label" style={{ marginBottom: 0 }}>Productos y servicios</span>
              <button type="button" onClick={() => setItems([...items, emptyItem()])} className="admin-btn" data-size="sm">
                <PlusCircle className="h-3.5 w-3.5" />Agregar ítem
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => {
                const lineTotal = (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity, 10) || 0);
                return (
                  <div key={i} className="rounded-lg p-3" style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)' }}>
                    <div className="flex items-start gap-2">
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                        <Field label="Producto" className="sm:col-span-2">
                          <select value={item.productId} onChange={(e) => pickProduct(i, e.target.value)} className="admin-input">
                            <option value="">— Producto libre (escribir abajo) —</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.description} · {formatPrice(p.price)}</option>)}
                          </select>
                        </Field>
                        <Field label="Descripción" className="sm:col-span-2">
                          <input required value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Descripción" className="admin-input" />
                        </Field>
                        <Field label="Precio unitario">
                          <input required type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: e.target.value })} placeholder="0.00" className="admin-input admin-num" />
                        </Field>
                        <Field label="Cantidad">
                          <input required type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} placeholder="1" className="admin-input admin-num" />
                        </Field>
                      </div>
                      <IconButton icon={Trash2} label="Quitar ítem" danger disabled={items.length === 1} onClick={() => removeItem(i)} />
                    </div>
                    <div className="mt-2 text-right text-xs" style={{ color: 'var(--a-muted)' }}>
                      Importe <span className="admin-num font-semibold" style={{ color: 'var(--a-fg)' }}>{formatPrice(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="Notas">
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones, referencia de la reserva, etc." className="admin-input" />
          </Field>

          <div className="flex items-center justify-between rounded-lg px-3.5 py-3" style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--a-muted)' }}>Total (ITBIS incluido)</span>
            <span className="admin-display admin-num text-xl font-bold">{formatPrice(draftTotal)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="admin-btn" data-variant="primary">
              {saving ? 'Guardando…' : 'Crear factura en borrador'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Detalle de factura */}
      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="admin-num">{invoiceCode(viewing)}</span>
            <Pill tone={STATUS_TONE[viewing.status] ?? 'mute'}>{STATUS_LABEL[viewing.status] ?? viewing.status}</Pill>
          </span>
        ) : ''}
        subtitle={viewing ? `${viewing.client.name} · ${formatDate(viewing.issueDate)}` : undefined}
        maxWidth="max-w-xl"
      >
        {viewing && (
          <div className="flex flex-col gap-4">
            <div>
              <DetailRow label="Cliente">{viewing.client.name}</DetailRow>
              <DetailRow label="Fecha de emisión">{formatDate(viewing.issueDate)}</DetailRow>
              {viewing.dueDate && <DetailRow label="Vencimiento">{formatDate(viewing.dueDate)}</DetailRow>}
              <DetailRow label="Estado"><Pill tone={STATUS_TONE[viewing.status] ?? 'mute'}>{STATUS_LABEL[viewing.status] ?? viewing.status}</Pill></DetailRow>
            </div>

            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--a-line)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="r">Cant.</th>
                    <th className="r">Precio</th>
                    <th className="r">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.description}</td>
                      <td className="r admin-num">{it.quantity}</td>
                      <td className="r admin-num nowrap">{formatPrice(it.unitPrice)}</td>
                      <td className="r admin-num nowrap"><b>{formatPrice(it.unitPrice * it.quantity)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto flex w-full flex-col gap-1 text-sm sm:w-72">
              <div className="flex justify-between" style={{ color: 'var(--a-muted)' }}>
                <span>Subtotal</span><span className="admin-num">{formatPrice(viewing.subtotal)}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--a-muted)' }}>
                <span>ITBIS</span><span className="admin-num">{formatPrice(viewing.itbis)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--a-line)' }}>
                <span className="font-semibold">Total</span>
                <span className="admin-display admin-num text-xl font-bold">{formatPrice(viewing.total)}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--a-ok)' }}>
                <span>Pagado</span><span className="admin-num">{formatPrice(viewing.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold" style={{ color: viewingBalance > 0 ? 'var(--a-bad)' : 'var(--a-fg)' }}>
                <span>Saldo</span><span className="admin-num">{formatPrice(viewingBalance)}</span>
              </div>
            </div>

            {viewing.notes && <p className="text-sm italic" style={{ color: 'var(--a-muted)' }}>&ldquo;{viewing.notes}&rdquo;</p>}

            {viewing.payments.length > 0 && (
              <div>
                <span className="admin-label">Pagos recibidos</span>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--a-line)' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th className="r">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewing.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="nowrap admin-num">{formatShortDate(p.receivedAt)}</td>
                          <td className="capitalize">{p.method}</td>
                          <td>{p.reference || <span className="muted">—</span>}</td>
                          <td className="r admin-num nowrap"><b>{formatPrice(p.amount)}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewing.status === 'anulada' && viewing.voidReason && (
              <div className="rounded-lg px-3 py-2 text-sm" style={{ borderLeft: '4px solid var(--a-bad)', background: 'var(--a-bad-soft)' }}>
                <b style={{ color: 'var(--a-bad)' }}>Anulada:</b> {viewing.voidReason}
              </div>
            )}

            {/* Acciones */}
            {viewing.status === 'borrador' && (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button type="button" onClick={() => handleDelete(viewing)} className="admin-btn" data-variant="danger">
                  <Trash2 className="h-4 w-4" />Eliminar
                </button>
                <button type="button" onClick={() => handleEmit(viewing)} disabled={actionLoading} className="admin-btn" data-variant="primary">
                  <Send className="h-4 w-4" />{actionLoading ? 'Emitiendo…' : 'Emitir factura'}
                </button>
              </div>
            )}

            {(['emitida', 'pagada_parcial'].includes(viewing.status) || (hasFullAccess(role) && !['borrador', 'anulada'].includes(viewing.status))) && !showPaymentForm && !showVoidForm && (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {hasFullAccess(role) && !['borrador', 'anulada'].includes(viewing.status) && (
                  <button type="button" onClick={() => setShowVoidForm(true)} className="admin-btn" data-variant="danger">
                    <Ban className="h-4 w-4" />Anular factura
                  </button>
                )}
                {['emitida', 'pagada_parcial'].includes(viewing.status) && (
                  <button type="button" onClick={() => setShowPaymentForm(true)} className="admin-btn" data-variant="primary">
                    <Wallet className="h-4 w-4" />Registrar pago
                  </button>
                )}
              </div>
            )}

            {showPaymentForm && (
              <form onSubmit={handlePayment} className="flex flex-col gap-3 rounded-lg p-3.5" style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)' }}>
                <span className="text-sm font-semibold">Registrar pago</span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Monto">
                    <input required type="number" step="0.01" min="0.01" placeholder={viewingBalance.toFixed(2)}
                      value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="admin-input admin-num" />
                  </Field>
                  <Field label="Método">
                    <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="admin-input capitalize">
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Referencia (opcional)">
                  <input placeholder="N° de transferencia, recibo…" value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="admin-input" />
                </Field>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="admin-btn">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="admin-btn" data-variant="primary">
                    {actionLoading ? 'Guardando…' : 'Guardar pago'}
                  </button>
                </div>
              </form>
            )}

            {showVoidForm && (
              <form onSubmit={handleVoid} className="flex flex-col gap-3 rounded-lg p-3.5" style={{ borderLeft: '4px solid var(--a-bad)', background: 'var(--a-bad-soft)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--a-bad)' }}>Anular factura</span>
                <Field label="Motivo de anulación (obligatorio)">
                  <textarea required rows={2} placeholder="Explica por qué se anula esta factura"
                    value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
                    className="admin-input" />
                </Field>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowVoidForm(false)} className="admin-btn">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="admin-btn" data-variant="danger">
                    {actionLoading ? 'Anulando…' : 'Confirmar anulación'}
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
