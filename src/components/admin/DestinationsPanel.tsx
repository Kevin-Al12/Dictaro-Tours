'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Plane } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import type { Destination } from '@/types';

const CONTINENTS = ['Europa', 'Asia', 'América', 'África', 'Oceanía'];

const emptyForm = {
  slug: '', name: '', country: '', continent: CONTINENTS[0],
  shortDescription: '', description: '', image: '',
  price: '', originalPrice: '', duration: '',
  rating: '', reviews: '', available: '', featured: false, tag: '',
  lat: '', lng: '',
  gallery: '', departureDates: '', includes: '', excludes: '', highlights: '',
};

const linesToArray = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const arrayToLines = (arr: string[]) => (arr || []).join('\n');

export default function DestinationsPanel() {
  const { data: destinations, loading, reload } = useAdminList<Destination>('/api/admin/destinations', 'destinations');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(d: Destination) {
    setEditing(d);
    setForm({
      slug: d.slug, name: d.name, country: d.country, continent: d.continent,
      shortDescription: d.shortDescription, description: d.description, image: d.image,
      price: String(d.price), originalPrice: d.originalPrice ? String(d.originalPrice) : '', duration: d.duration,
      rating: String(d.rating), reviews: String(d.reviews), available: String(d.available),
      featured: d.featured, tag: d.tag || '',
      lat: String(d.lat), lng: String(d.lng),
      gallery: arrayToLines(d.gallery), departureDates: arrayToLines(d.departureDates),
      includes: arrayToLines(d.includes), excludes: arrayToLines(d.excludes), highlights: arrayToLines(d.highlights),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/admin/destinations/${editing.id}` : '/api/admin/destinations';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        gallery: linesToArray(form.gallery),
        departureDates: linesToArray(form.departureDates),
        includes: linesToArray(form.includes),
        excludes: linesToArray(form.excludes),
        highlights: linesToArray(form.highlights),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Error al guardar');
      return;
    }
    toast.success(editing ? 'Destino actualizado' : 'Destino creado');
    setModalOpen(false);
    reload();
  }

  async function handleDelete(d: Destination) {
    const ok = await deleteAdminItem(`/api/admin/destinations/${d.id}`, `¿Eliminar "${d.name}"? Dejará de verse en la web pública.`);
    if (!ok) return;
    toast.success('Destino eliminado');
    reload();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="admin-display text-2xl font-bold text-gray-900">Destinos y paquetes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Esto alimenta directamente lo que ve el cliente en la web pública.</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />Nuevo destino
        </button>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={destinations.length === 0}
        emptyIcon={Plane}
        emptyMessage="Aún no hay destinos. Agrega el primero."
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">Destino</th>
              <th className="px-4 py-2 text-left">País</th>
              <th className="px-4 py-2 text-left">Precio</th>
              <th className="px-4 py-2 text-left">Cupos</th>
              <th className="px-4 py-2 text-left">Rating</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {destinations.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-gray-900 text-sm">{d.name}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{d.country}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{formatPrice(d.price)}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{d.available}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">⭐ {d.rating}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(d)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar destino' : 'Nuevo destino'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="París"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL)</label>
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="paris-francia"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
              <input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Francia"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Continente</label>
              <select value={form.continent} onChange={(e) => setForm({ ...form, continent: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 appearance-none">
                {CONTINENTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción corta</label>
            <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="La ciudad del amor, arte y gastronomía inigualable."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción completa</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Imagen principal (URL)</label>
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio (DOP)</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio original</label>
              <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="opcional"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración</label>
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="10 días / 9 noches"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reseñas</label>
              <input type="number" min="0" value={form.reviews} onChange={(e) => setForm({ ...form, reviews: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupos</label>
              <input type="number" min="0" value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Etiqueta</label>
              <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}
                placeholder="Más vendido"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitud</label>
              <input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitud</label>
              <input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Destacado en la página de inicio
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Galería (una URL por línea)</label>
              <textarea rows={3} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gold-500 resize-none font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fechas de salida (una por línea, AAAA-MM-DD)</label>
              <textarea rows={3} value={form.departureDates} onChange={(e) => setForm({ ...form, departureDates: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gold-500 resize-none font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Incluye (una por línea)</label>
              <textarea rows={4} value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No incluye (una por línea)</label>
              <textarea rows={4} value={form.excludes} onChange={(e) => setForm({ ...form, excludes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Destacados (una por línea)</label>
              <textarea rows={4} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear destino'}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
