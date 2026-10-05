'use client';

import { useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, Plane, Search, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Pill, IconButton, Field, FilterChips } from './ui';
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

type TextKey = Exclude<keyof typeof emptyForm, 'featured'>;

const linesToArray = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const arrayToLines = (arr: string[]) => (arr || []).join('\n');

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--a-faint)' }}>
      {children}
    </h3>
  );
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg"
      style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)', color: 'var(--a-faint)' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageOff className="h-4 w-4" />
      )}
    </span>
  );
}

export default function DestinationsPanel() {
  const { data: destinations, loading, reload } = useAdminList<Destination>('/api/admin/destinations', 'destinations');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [continent, setContinent] = useState<string>('all');
  const [query, setQuery] = useState('');

  const chips = useMemo(() => {
    const present = Array.from(new Set([...CONTINENTS, ...destinations.map((d) => d.continent)])).filter(
      (c) => destinations.some((d) => d.continent === c),
    );
    return [
      { value: 'all', label: 'Todos', count: destinations.length },
      ...present.map((c) => ({ value: c, label: c, count: destinations.filter((d) => d.continent === c).length })),
    ];
  }, [destinations]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      if (continent !== 'all' && d.continent !== continent) return false;
      if (!q) return true;
      return `${d.name} ${d.country} ${d.tag ?? ''}`.toLowerCase().includes(q);
    });
  }, [destinations, continent, query]);

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

  // Enlaza un campo de texto del formulario.
  const bind = (key: TextKey) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

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

  const newButton = (
    <button type="button" onClick={openNew} className="admin-btn" data-variant="primary">
      <Plus className="h-4 w-4" />Nuevo destino
    </button>
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Destinos y paquetes"
        subtitle={
          loading
            ? 'Cargando…'
            : `${destinations.length} ${destinations.length === 1 ? 'destino publicado' : 'destinos publicados'} · se muestran en la web pública`
        }
        actions={newButton}
      />

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={Plane}
        emptyMessage={destinations.length === 0 ? 'Aún no hay destinos. Agrega el primero.' : 'Ningún destino coincide con el filtro.'}
        emptyAction={destinations.length === 0 ? newButton : undefined}
        toolbar={
          <>
            <FilterChips value={continent} onChange={setContinent} options={chips} />
            <label className="relative w-full sm:ml-auto sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--a-faint)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar destino o país…" aria-label="Buscar destinos" className="admin-input pl-8" />
            </label>
          </>
        }
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Destino</th>
              <th>Duración</th>
              <th className="r">Precio</th>
              <th className="r">Cupos</th>
              <th>Destacado</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Thumb src={d.image} alt={d.name} />
                    <div className="min-w-0">
                      <b className="block truncate font-semibold">{d.name}</b>
                      <span className="block truncate text-xs" style={{ color: 'var(--a-muted)' }}>
                        {d.country}{d.tag ? ` · ${d.tag}` : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="nowrap">{d.duration || <span className="muted">—</span>}</td>
                <td className="r nowrap admin-num">
                  {d.originalPrice ? (
                    <span className="mr-1.5 text-xs line-through" style={{ color: 'var(--a-faint)' }}>{formatPrice(d.originalPrice)}</span>
                  ) : null}
                  <b className="font-semibold">{formatPrice(d.price)}</b>
                </td>
                <td className="r admin-num">{d.available}</td>
                <td>{d.featured ? <Pill tone="info">Destacado</Pill> : <span className="muted">—</span>}</td>
                <td className="r">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton icon={Edit3} label="Editar" onClick={() => openEdit(d)} />
                    <IconButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(d)} />
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
        title={editing ? 'Editar destino' : 'Nuevo destino'}
        subtitle={editing ? editing.name : 'Se publicará en la web pública al guardar.'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="flex flex-col gap-3.5">
            <SectionTitle>Información básica</SectionTitle>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Nombre">
                <input required {...bind('name')} placeholder="París" className="admin-input" />
              </Field>
              <Field label="Slug (URL)">
                <input required {...bind('slug')} placeholder="paris-francia" className="admin-input" />
              </Field>
              <Field label="País">
                <input required {...bind('country')} placeholder="Francia" className="admin-input" />
              </Field>
              <Field label="Continente">
                <select {...bind('continent')} className="admin-input">
                  {CONTINENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Descripción corta">
              <input {...bind('shortDescription')} placeholder="La ciudad del amor, arte y gastronomía inigualable." className="admin-input" />
            </Field>
            <Field label="Descripción completa">
              <textarea rows={3} {...bind('description')} className="admin-input" />
            </Field>
            <Field label="Imagen principal (URL)">
              <input {...bind('image')} placeholder="https://..." className="admin-input" />
            </Field>
          </section>

          <section className="flex flex-col gap-3.5">
            <SectionTitle>Precio y disponibilidad</SectionTitle>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Precio (DOP)">
                <input required type="number" step="0.01" min="0" {...bind('price')} className="admin-input admin-num" />
              </Field>
              <Field label="Precio original">
                <input type="number" step="0.01" min="0" {...bind('originalPrice')} placeholder="Opcional" className="admin-input admin-num" />
              </Field>
              <Field label="Duración">
                <input {...bind('duration')} placeholder="10 días / 9 noches" className="admin-input" />
              </Field>
              <Field label="Cupos">
                <input type="number" min="0" {...bind('available')} className="admin-input admin-num" />
              </Field>
              <Field label="Etiqueta">
                <input {...bind('tag')} placeholder="Más vendido" className="admin-input" />
              </Field>
              <div className="flex items-end">
                <label
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm"
                  style={{ border: '1px solid var(--a-line)', background: 'var(--a-surface-2)' }}
                >
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                  Destacado en la página de inicio
                </label>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3.5">
            <SectionTitle>Reseñas y ubicación</SectionTitle>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Rating (0–5)">
                <input type="number" step="0.1" min="0" max="5" {...bind('rating')} className="admin-input admin-num" />
              </Field>
              <Field label="Reseñas">
                <input type="number" min="0" {...bind('reviews')} className="admin-input admin-num" />
              </Field>
              <Field label="Latitud">
                <input type="number" step="0.0001" {...bind('lat')} className="admin-input admin-num" />
              </Field>
              <Field label="Longitud">
                <input type="number" step="0.0001" {...bind('lng')} className="admin-input admin-num" />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-3.5">
            <SectionTitle>Galería y salidas</SectionTitle>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Galería (una URL por línea)">
                <textarea rows={4} {...bind('gallery')} className="admin-input font-mono text-xs" />
              </Field>
              <Field label="Fechas de salida (AAAA-MM-DD, una por línea)">
                <textarea rows={4} {...bind('departureDates')} className="admin-input font-mono text-xs" />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-3.5">
            <SectionTitle>Qué incluye el paquete</SectionTitle>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Incluye (una por línea)">
                <textarea rows={4} {...bind('includes')} className="admin-input" />
              </Field>
              <Field label="No incluye (una por línea)">
                <textarea rows={4} {...bind('excludes')} className="admin-input" />
              </Field>
            </div>
            <Field label="Destacados del viaje (una por línea)">
              <textarea rows={3} {...bind('highlights')} className="admin-input" />
            </Field>
          </section>

          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--a-line)' }}>
            <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="admin-btn" data-variant="primary">
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear destino'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
