'use client';

import { useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, Users, Search, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Avatar, IconButton, Field, Pill } from './ui';
import ClientProfile, { passportStatus, whatsappLink } from './ClientProfile';
import { formatShortDate } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  notes: string | null;
}

const emptyForm = { name: '', phone: '', email: '', document: '', passportNumber: '', passportExpiry: '', notes: '' };

export default function ClientsPanel() {
  const { data: clients, loading, reload } = useAdminList<Client>('/api/admin/clients', 'clients');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.name} ${c.phone ?? ''} ${c.email ?? ''} ${c.document ?? ''}`.toLowerCase().includes(q));
  }, [clients, query]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      document: c.document || '',
      passportNumber: c.passportNumber || '',
      passportExpiry: c.passportExpiry ? c.passportExpiry.slice(0, 10) : '',
      notes: c.notes || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/admin/clients/${editing.id}` : '/api/admin/clients';
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
    toast.success(editing ? 'Cliente actualizado' : 'Cliente creado');
    setModalOpen(false);
    reload();
    setProfileVersion((v) => v + 1);
  }

  async function handleDelete(c: Client) {
    const ok = await deleteAdminItem(`/api/admin/clients/${c.id}`, `¿Eliminar a "${c.name}"?`);
    if (!ok) return;
    toast.success('Cliente eliminado');
    reload();
  }

  const newButton = (
    <button type="button" onClick={openNew} className="admin-btn" data-variant="primary">
      <Plus className="h-4 w-4" />Nuevo cliente
    </button>
  );

  const formModal = (
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Field label="Nombre completo">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" className="admin-input" />
          </Field>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Teléfono">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="809-000-0000" className="admin-input" />
            </Field>
            <Field label="Cédula / RNC">
              <input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="001-0000000-0" className="admin-input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="N° de pasaporte">
              <input value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} placeholder="RD1234567" className="admin-input" />
            </Field>
            <Field label="Vencimiento del pasaporte">
              <input type="date" value={form.passportExpiry} onChange={(e) => setForm({ ...form, passportExpiry: e.target.value })} className="admin-input" />
            </Field>
          </div>
          <Field label="Correo">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@correo.com" className="admin-input" />
          </Field>
          <Field label="Notas">
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferencias, historial, etc." className="admin-input" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="admin-btn" data-variant="primary">
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </AdminModal>
  );

  if (selectedId) {
    return (
      <>
        <ClientProfile
          clientId={selectedId}
          refreshKey={profileVersion}
          onBack={() => setSelectedId(null)}
          onEdit={(c) => openEdit(clients.find((x) => x.id === c.id) ?? c)}
        />
        {formModal}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Clientes"
        subtitle={loading ? 'Cargando…' : `${clients.length} ${clients.length === 1 ? 'cliente registrado' : 'clientes registrados'}`}
        actions={newButton}
      />

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={Users}
        emptyMessage={clients.length === 0 ? 'Aún no hay clientes. Agrega el primero.' : 'Ningún cliente coincide con la búsqueda.'}
        emptyAction={clients.length === 0 ? newButton : undefined}
        toolbar={
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--a-faint)' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, teléfono o documento…" aria-label="Buscar clientes" className="admin-input pl-8" />
          </label>
        }
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Documento</th>
              <th>Pasaporte</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const wa = whatsappLink(c.phone);
              const passport = passportStatus(c.passportExpiry);
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className="block max-w-full truncate text-left font-semibold hover:underline"
                          style={{ color: 'var(--a-fg)' }}
                        >
                          {c.name}
                        </button>
                        {c.email && <span className="block truncate text-xs" style={{ color: 'var(--a-muted)' }}>{c.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="nowrap admin-num">{c.phone || <span className="muted">—</span>}</td>
                  <td className="nowrap admin-num">{c.document || <span className="muted">—</span>}</td>
                  <td className="nowrap">
                    {passport ? (
                      <span title={c.passportNumber ?? undefined}><Pill tone={passport.tone}>{passport.label}</Pill></span>
                    ) : c.passportNumber || c.passportExpiry ? (
                      <span className="admin-num muted">
                        {c.passportNumber || '—'}{c.passportExpiry ? ` · ${formatShortDate(c.passportExpiry)}` : ''}
                      </span>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td className="r">
                    <div className="flex items-center justify-end gap-1">
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-icon-btn"
                          aria-label={`Escribir a ${c.name} por WhatsApp`}
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      <button type="button" className="admin-btn mr-1" data-size="sm" onClick={() => setSelectedId(c.id)}>Ver ficha</button>
                      <IconButton icon={Edit3} label="Editar" onClick={() => openEdit(c)} />
                      <IconButton icon={Trash2} label="Eliminar" danger onClick={() => handleDelete(c)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>

      {formModal}
    </div>
  );
}
