'use client';

import { useEffect, useState } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

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

  if (errorMessage) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <Settings className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{errorMessage}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="py-6 text-center text-sm text-gray-400">Cargando...</div>;
  }

  return (
    <div className="space-y-3 max-w-xl">
      <h2 className="text-base font-semibold text-gray-900">Configuración de la empresa</h2>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Razón social</label>
            <input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">RNC</label>
              <input value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                placeholder="000-00000-0"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tasa de ITBIS (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.itbisRate}
                onChange={(e) => setForm({ ...form, itbisRate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección fiscal</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo (URL)</label>
            <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Proveedor de e-CF</label>
            <input value={form.ncfProvider} onChange={(e) => setForm({ ...form, ncfProvider: e.target.value })}
              placeholder="Aún sin definir"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gold-500" />
            <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              La DGII exige factura electrónica desde el 15 de noviembre de 2026. Este campo es solo
              informativo por ahora — todavía no hay conexión real con ningún proveedor de e-CF.
            </p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      </div>
    </div>
  );
}
