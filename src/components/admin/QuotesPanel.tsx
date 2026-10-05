'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, FileText, Eye, PlusCircle, Receipt, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, formatShortDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import { useAdminTab } from './AdminTabContext';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Who, StatusSelect, IconButton, FilterChips, Field, Pill, type Tone } from './ui';

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  description: string;
  price: number;
  cost?: number;
}

interface QuoteItem {
  id: string;
  description: string;
  unitPrice: number;
  unitCost?: number;
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
  unitCost: number; // costo del proveedor, viene del producto elegido
  quantity: string;
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  vencida: 'Vencida',
};

const STATUS_TONE: Record<string, Tone> = {
  borrador: 'mute',
  enviada: 'info',
  aceptada: 'ok',
  rechazada: 'bad',
  vencida: 'warn',
};

type Filter = 'todas' | keyof typeof STATUS_LABEL;

const quoteCode = (n: number) => `COT-${String(n).padStart(4, '0')}`;

const emptyItem = (): DraftItem => ({ productId: '', description: '', unitPrice: '', unitCost: 0, quantity: '1' });

// "Costo proveedores RD$X · Ganancia RD$Y · Margen Z%" debajo del total.
function ProfitSummary({ total, cost }: { total: number; cost: number }) {
  if (cost <= 0 || total <= 0) return null;
  const profit = total - cost;
  const margin = Math.round((profit / total) * 100);
  return (
    <p className="admin-num text-right text-xs font-semibold" style={{ color: profit >= 0 ? 'var(--a-ok)' : 'var(--a-bad)' }}>
      Costo proveedores {formatPrice(cost)} · Ganancia {formatPrice(profit)} · Margen {margin}%
    </p>
  );
}

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
  const [filter, setFilter] = useState<Filter>('todas');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of quotes) c[q.status] = (c[q.status] ?? 0) + 1;
    return c;
  }, [quotes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter((x) =>
      (filter === 'todas' || x.status === filter) &&
      (!q || `${x.client.name} ${quoteCode(x.number)} ${x.notes ?? ''}`.toLowerCase().includes(q)),
    );
  }, [quotes, filter, query]);

  const acceptedTotal = useMemo(
    () => quotes.filter((q) => q.status === 'aceptada').reduce((sum, q) => sum + q.total, 0),
    [quotes],
  );

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
      unitCost: product?.cost ?? 0,
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
  const draftCost = items.reduce((sum, it) => sum + (it.unitCost || 0) * (parseInt(it.quantity, 10) || 0), 0);

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
          unitCost: it.unitCost || 0,
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
    const ok = await deleteAdminItem(`/api/admin/quotes/${quote.id}`, `¿Eliminar la cotización ${quoteCode(quote.number)}?`);
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
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Cotizaciones"
        subtitle={loading ? 'Cargando…' : `${quotes.length} en total · ${counts.enviada ?? 0} enviadas · ${formatPrice(acceptedTotal)} aceptado`}
        actions={
          <button type="button" onClick={openNew} className="admin-btn" data-variant="primary">
            <Plus className="h-4 w-4" />Nueva cotización
          </button>
        }
      />

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={FileText}
        emptyMessage={
          quotes.length > 0
            ? 'Ninguna cotización coincide con el filtro.'
            : clients.length === 0
              ? 'Primero agrega un cliente en la pestaña Clientes, luego crea tu primera cotización.'
              : 'Aún no hay cotizaciones. Crea la primera.'
        }
        emptyAction={
          quotes.length === 0 && clients.length > 0 ? (
            <button type="button" onClick={openNew} className="admin-btn" data-variant="primary" data-size="sm">
              <Plus className="h-3.5 w-3.5" />Nueva cotización
            </button>
          ) : undefined
        }
        toolbar={
          <>
            <FilterChips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'todas', label: 'Todas', count: quotes.length },
                ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value: value as Filter, label, count: counts[value] ?? 0 })),
              ]}
            />
            <label className="relative ml-auto w-full sm:w-60">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--a-faint)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente o número…" aria-label="Buscar cotizaciones" className="admin-input pl-8" />
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
              <th className="r">Ítems</th>
              <th className="r">Total</th>
              <th>Estado</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((q) => (
              <tr key={q.id}>
                <td className="nowrap admin-num muted">{quoteCode(q.number)}</td>
                <td><Who name={q.client.name} detail={q.notes || undefined} /></td>
                <td className="nowrap admin-num">{formatShortDate(q.createdAt)}</td>
                <td className="r admin-num">{q.items.length}</td>
                <td className="r admin-num nowrap"><b>{formatPrice(q.total)}</b></td>
                <td>
                  <StatusSelect label={`Estado de la cotización ${quoteCode(q.number)}`} value={q.status} options={STATUS_LABEL} tones={STATUS_TONE} onChange={(s) => changeStatus(q, s)} />
                </td>
                <td className="r">
                  <div className="flex items-center justify-end gap-1">
                    {q.status === 'aceptada' && (
                      <button type="button" className="admin-btn" data-size="sm" onClick={() => handleConvert(q)} disabled={converting === q.id}>
                        <Receipt className="h-3.5 w-3.5" />
                        {converting === q.id ? 'Creando…' : 'Facturar'}
                      </button>
                    )}
                    <IconButton icon={Eye} label="Ver detalle" onClick={() => setViewing(q)} />
                    <IconButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(q)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      {/* New quote builder */}
      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva cotización"
        subtitle="Elige el cliente y agrega productos o servicios"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Cliente">
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="admin-input">
                <option value="">Selecciona un cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="admin-label" style={{ marginBottom: 0 }}>Productos y servicios</span>
              <button type="button" onClick={() => setItems([...items, emptyItem()])} className="admin-btn" data-size="sm">
                <PlusCircle className="h-3.5 w-3.5" />Agregar ítem
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item, i) => {
                const lineTotal = (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity, 10) || 0);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-1 gap-2 rounded-lg p-3 sm:grid-cols-[1fr_110px_80px_auto]"
                    style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)' }}
                  >
                    <div className="flex flex-col gap-2 sm:col-span-4">
                      <select aria-label={`Producto del ítem ${i + 1}`} value={item.productId} onChange={(e) => pickProduct(i, e.target.value)} className="admin-input">
                        <option value="">— Producto libre (escribir abajo) —</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.description} · {formatPrice(p.price)}</option>)}
                      </select>
                    </div>
                    <input required aria-label={`Descripción del ítem ${i + 1}`} value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Descripción" className="admin-input" />
                    <div className="grid grid-cols-2 gap-2 sm:contents">
                      <input required aria-label={`Precio del ítem ${i + 1}`} type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
                        placeholder="Precio" className="admin-input admin-num text-right" />
                      <input required aria-label={`Cantidad del ítem ${i + 1}`} type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })}
                        placeholder="Cant." className="admin-input admin-num text-right" />
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <span className="admin-num text-sm font-semibold sm:min-w-[84px] sm:text-right">{formatPrice(lineTotal)}</span>
                      <IconButton icon={Trash2} label={`Quitar ítem ${i + 1}`} danger disabled={items.length === 1} onClick={() => removeItem(i)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="Notas">
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones, vigencia, etc." className="admin-input resize-none" />
          </Field>

          <div className="flex items-baseline justify-end gap-4 pt-3" style={{ borderTop: '1px solid var(--a-line)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--a-muted)' }}>Total</span>
            <span className="admin-display admin-num text-xl font-bold">{formatPrice(draftTotal)}</span>
          </div>
          <div className="-mt-2"><ProfitSummary total={draftTotal} cost={draftCost} /></div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="admin-btn" data-variant="primary">
              {saving ? 'Guardando…' : 'Crear cotización'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* View quote detail */}
      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? quoteCode(viewing.number) : ''}
        subtitle={viewing ? `${viewing.client.name} · ${formatDate(viewing.createdAt)}` : undefined}
        maxWidth="max-w-lg"
      >
        {viewing && (
          <>
            <div className="mb-3">
              <Pill tone={STATUS_TONE[viewing.status] ?? 'mute'}>{STATUS_LABEL[viewing.status] ?? viewing.status}</Pill>
            </div>
            <div className="-mx-5 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="r">Cant.</th>
                    <th className="r">Precio</th>
                    <th className="r">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.description}</td>
                      <td className="r admin-num">{it.quantity}</td>
                      <td className="r admin-num nowrap">{formatPrice(it.unitPrice)}</td>
                      <td className="r admin-num nowrap"><b>{formatPrice(it.subtotal)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewing.notes && <p className="pt-3 text-sm italic" style={{ color: 'var(--a-muted)' }}>&ldquo;{viewing.notes}&rdquo;</p>}

            <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--a-line)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--a-muted)' }}>Total</span>
              <span className="admin-display admin-num text-xl font-bold">{formatPrice(viewing.total)}</span>
            </div>
            <div className="mt-1">
              <ProfitSummary total={viewing.total} cost={viewing.items.reduce((s, it) => s + (it.unitCost || 0) * it.quantity, 0)} />
            </div>

            {viewing.status === 'aceptada' && (
              <div className="mt-4 flex justify-end">
                <button type="button" className="admin-btn" data-variant="primary" onClick={() => handleConvert(viewing)} disabled={converting === viewing.id}>
                  <Receipt className="h-4 w-4" />
                  {converting === viewing.id ? 'Creando…' : 'Convertir a factura'}
                </button>
              </div>
            )}
          </>
        )}
      </AdminModal>
    </div>
  );
}
