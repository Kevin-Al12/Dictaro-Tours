'use client';

import { useEffect, useState } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field } from './ui';

interface CompanySettings {
  legalName: string;
  rnc: string | null;
  address: string | null;
  itbisRate: number;
  ncfProvider: string | null;
  logoUrl: string | null;
}

const emptyForm = { legalName: "D'Itaros Tours", rnc: '', address: '', itbisRate: '18', ncfProvider: '', logoUrl: '' };

export default function CompanySettingsPanel() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/company-settings')
      .then(async (res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          setErrorMessage('Tu sesión expiró. Vuelve a iniciar sesión.');
        } else if (res.status === 403) {
          setErrorMessage('No tienes permiso para ver la configuración de la empresa.');
        } else {
          const body = await res.json().catch(() => ({}));
          setErrorMessage(body.error || 'No se pudo cargar la configuración de la empresa.');
        }
        return null;
      })
      .then((json) => {
        if (!json) return;
        const s: CompanySettings = json.settings;
        setForm({
          legalName: s.legalName,
          rnc: s.rnc || '',
          address: s.address || '',
          itbisRate: String(Math.round(s.itbisRate * 100)),
          ncfProvider: s.ncfProvider || '',
          logoUrl: s.logoUrl || '',
        });
      })
      .catch(() => setErrorMessage('No se pudo cargar la configuración de la empresa.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/company-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        itbisRate: (parseFloat(form.itbisRate) || 0) / 100,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Error al guardar');
      return;
    }
    toast.success('Configuración guardada');
  }

  const card = (body: React.ReactNode) => (
    <section className="admin-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
        <h2 className="text-[14.5px] font-bold">Datos de la empresa</h2>
        <span className="ml-auto text-xs" style={{ color: 'var(--a-muted)' }}>Aparecen en facturas y cotizaciones</span>
      </div>
      {body}
    </section>
  );

  if (errorMessage) {
    return card(
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: 'var(--a-surface-2)', color: 'var(--a-faint)' }}>
          <Settings className="h-5 w-5" />
        </span>
        <p className="max-w-sm text-sm" style={{ color: 'var(--a-muted)' }}>{errorMessage}</p>
      </div>,
    );
  }

  if (loading) {
    return card(<div className="py-10 text-center text-sm" style={{ color: 'var(--a-faint)' }}>Cargando…</div>);
  }

  return card(
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 px-4 py-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Razón social" className="sm:col-span-2">
          <input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} className="admin-input" />
        </Field>
        <Field label="RNC">
          <input value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })} placeholder="000-00000-0" className="admin-input admin-num" />
        </Field>
        <Field label="Tasa de ITBIS (%)">
          <input type="number" step="0.01" min="0" max="100" value={form.itbisRate}
            onChange={(e) => setForm({ ...form, itbisRate: e.target.value })} className="admin-input admin-num" />
        </Field>
        <Field label="Dirección fiscal" className="sm:col-span-2">
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="admin-input" />
        </Field>
        <Field label="Logo (URL)">
          <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className="admin-input" />
        </Field>
        <Field label="Proveedor de e-CF">
          <input value={form.ncfProvider} onChange={(e) => setForm({ ...form, ncfProvider: e.target.value })} placeholder="Aún sin definir" className="admin-input" />
        </Field>
      </div>

      <p className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px]" style={{ background: 'var(--a-warn-soft)', color: 'var(--a-warn)' }}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          La DGII exige factura electrónica desde el 15 de noviembre de 2026. El proveedor de e-CF es solo
          informativo por ahora — todavía no hay conexión real con ningún proveedor.
        </span>
      </p>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={saving} className="admin-btn" data-variant="primary">
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </form>,
  );
}
