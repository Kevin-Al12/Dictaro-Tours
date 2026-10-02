'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminList } from '@/hooks/useAdminList';
import { deleteAdminItem } from '@/lib/adminActions';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
}

const emptyForm = { name: '', phone: '', email: '', document: '', notes: '' };

export default function ClientsPanel() {
  const { data: clients, loading, reload } = useAdminList<Client>('/api/admin/clients', 'clients');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', document: c.document || '', notes: c.notes || '' });
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
  }

  async function handleDelete(c: Client) {
    const ok = await deleteAdminItem(`/api/admin/clients/${c.id}`, `¿Eliminar a "${c.name}"?`);
    if (!ok) return;
    toast.success('Cliente eliminado');
    reload();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="admin-display text-2xl font-bold text-gray-900">Clientes</h2>
        <button onClick={openNew} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />Nuevo cliente
        </button>
      </div>

      <AdminTableShell
        loading={loading}
        isEmpty={clients.length === 0}
        emptyIcon={Users}
        emptyMessage="Aún no hay clientes. Agrega el primero."
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Teléfono</th>
              <th className="px-4 py-2 text-left">Correo</th>
              <th className="px-4 py-2 text-left">Documento</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{c.phone || '—'}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{c.email || '—'}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{c.document || '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (809) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cédula/Pasaporte</label>
              <input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })}
                placeholder="001-0000000-0"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@correo.com"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Preferencias, historial, etc."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500 resize-none" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
