'use client';

import { useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Pill, IconButton, Field, FilterChips } from './ui';

interface Product {
  id: string;
  code: string;
  description: string;
  price: number;
  cost: number;
  category: string;
}

const CATEGORIES = ['Hotel', 'Vuelo', 'Excursión', 'Migratorio', 'Paquete', 'Otro'];

const emptyForm = { code: '', description: '', price: '', cost: '', category: CATEGORIES[0] };

// Margen sobre el precio de venta, en porcentaje entero.
function marginOf(p: { price: number; cost: number }) {
  return p.price > 0 ? Math.round(((p.price - (p.cost || 0)) / p.price) * 100) : null;
}

export default function ProductsPanel() {
  const { data: products, loading, reload } = useAdminList<Product>('/api/admin/products', 'products');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const chipOptions = useMemo(() => {
    const present = Array.from(new Set([...CATEGORIES, ...products.map((p) => p.category)]))
      .filter((c) => products.some((p) => p.category === c));
    return [
      { value: 'all', label: 'Todos', count: products.length },
      ...present.map((c) => ({ value: c, label: c, count: products.filter((p) => p.category === c).length })),
    ];
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) =>
      (category === 'all' || p.category === category) &&
      (!q || `${p.code} ${p.description}`.toLowerCase().includes(q)),
    );
  }, [products, category, query]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ code: p.code, description: p.description, price: String(p.price), cost: p.cost ? String(p.cost) : '', category: p.category });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Error al guardar');
      return;
    }
    toast.success(editing ? 'Producto actualizado' : 'Producto creado');
    setModalOpen(false);
    reload();
  }

  async function handleDelete(p: Product) {
    const ok = await deleteAdminItem(`/api/admin/products/${p.id}`, `¿Eliminar "${p.description}"?`);
    if (!ok) return;
    toast.success('Producto eliminado');
    reload();
  }

  const newButton = (
    <button type="button" onClick={openNew} className="admin-btn" data-variant="primary">
      <Plus className="h-4 w-4" />Nuevo producto
    </button>
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Productos y servicios"
        subtitle={loading ? 'Cargando…' : `${products.length} ${products.length === 1 ? 'producto en el catálogo' : 'productos en el catálogo'}`}
        actions={newButton}
      />

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={Package}
        emptyMessage={products.length === 0 ? 'Aún no hay productos. Agrega el primero.' : 'Ningún producto coincide con el filtro.'}
        emptyAction={products.length === 0 ? newButton : undefined}
        toolbar={
          <>
            <FilterChips value={category} onChange={setCategory} options={chipOptions} />
            <label className="relative w-full sm:ml-auto sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--a-faint)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por código o descripción…" aria-label="Buscar productos" className="admin-input pl-8" />
            </label>
          </>
        }
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th className="r">Costo</th>
              <th className="r">Precio</th>
              <th className="r">Margen</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td className="nowrap muted font-mono text-xs">{p.code}</td>
                <td className="font-medium">{p.description}</td>
                <td className="nowrap"><Pill tone="mute">{p.category}</Pill></td>
                <td className="r nowrap admin-num muted">{p.cost ? formatPrice(p.cost) : '—'}</td>
                <td className="r nowrap admin-num font-semibold">{formatPrice(p.price)}</td>
                <td className="r nowrap">
                  {(() => {
                    const m = marginOf(p);
                    return m === null ? <span className="muted">—</span> : <Pill tone={m >= 20 ? 'ok' : 'warn'}>{m}%</Pill>;
                  })()}
                </td>
                <td className="r">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton icon={Edit3} label="Editar" onClick={() => openEdit(p)} />
                    <IconButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(p)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        subtitle={editing ? editing.code : 'Se usará al armar cotizaciones y facturas.'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Código">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="000123" className="admin-input font-mono" />
            </Field>
            <Field label="Categoría">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Descripción">
            <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Habitación doble Hard Rock" className="admin-input" />
          </Field>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Costo del proveedor">
              <input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" className="admin-input admin-num" />
            </Field>
            <Field label="Precio (DOP)">
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="admin-input admin-num" />
            </Field>
          </div>
          {(() => {
            const m = marginOf({ price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || 0 });
            return m === null ? null : (
              <p className="-mt-1 text-xs" style={{ color: m >= 20 ? 'var(--a-ok)' : 'var(--a-warn)' }}>
                Ganancia {formatPrice((parseFloat(form.price) || 0) - (parseFloat(form.cost) || 0))} por unidad · margen {m}%
              </p>
            );
          })()}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="admin-btn" data-variant="primary">
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
