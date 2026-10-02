'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';

interface Product {
  id: string;
  code: string;
  description: string;
  price: number;
  category: string;
}

const CATEGORIES = ['Hotel', 'Vuelo', 'Excursión', 'Migratorio', 'Paquete', 'Otro'];

const emptyForm = { code: '', description: '', price: '', category: CATEGORIES[0] };

export default function ProductsPanel() {
  const { data: products, loading, reload } = useAdminList<Product>('/api/admin/products', 'products');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ code: p.code, description: p.description, price: String(p.price), category: p.category });
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Productos y Servicios</h2>
        <button onClick={openNew} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />Nuevo producto
        </button>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={products.length === 0}
        emptyIcon={Package}
        emptyMessage="Aún no hay productos. Agrega el primero."
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Descripción</th>
              <th className="px-4 py-2 text-left">Categoría</th>
              <th className="px-4 py-2 text-left">Precio</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{p.code}</td>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{p.description}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{p.category}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{formatPrice(p.price)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="000123"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Habitación doble Hard Rock"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 appearance-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio (DOP)</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
