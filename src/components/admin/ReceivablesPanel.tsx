'use client';

import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import AdminTableShell from './AdminTableShell';

interface Receivable {
  id: string;
  number: number | null;
  clientId: string;
  clientName: string;
  total: number;
  amountPaid: number;
  balance: number;
  issueDate: string;
  dueDate: string | null;
  daysOld: number;
  bucket: string;
}

interface ReceivablesData {
  receivables: Receivable[];
  summary: { total: number; bucket0_30: number; bucket31_60: number; bucket61plus: number };
}

const BUCKET_LABEL: Record<string, string> = {
  '0-30': '0–30 días',
  '31-60': '31–60 días',
  '61+': '61+ días',
};

const BUCKET_COLOR: Record<string, string> = {
  '0-30': 'bg-green-100 text-green-700',
  '31-60': 'bg-yellow-100 text-yellow-700',
  '61+': 'bg-red-100 text-red-700',
};

export default function ReceivablesPanel() {
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/receivables')
      .then(async (res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          setErrorMessage('Tu sesión expiró. Vuelve a iniciar sesión.');
        } else if (res.status === 403) {
          setErrorMessage('No tienes permiso para ver cuentas por cobrar.');
        } else {
          const body = await res.json().catch(() => ({}));
          setErrorMessage(body.error || 'No se pudieron cargar las cuentas por cobrar.');
        }
        return null;
      })
      .then((json) => { if (json) setData(json); })
      .catch(() => setErrorMessage('No se pudieron cargar las cuentas por cobrar.'))
      .finally(() => setLoading(false));
  }, []);

  if (errorMessage) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <Landmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="admin-display text-2xl font-bold text-gray-900">Cobros</h2>

      {!loading && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3">
            <div className="text-lg font-semibold text-gray-900">{formatPrice(data.summary.total)}</div>
            <div className="text-xs text-gray-500 mt-1">Total pendiente</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-lg font-semibold text-gray-900">{formatPrice(data.summary.bucket0_30)}</div>
            <div className="text-xs text-gray-500 mt-1">0–30 días</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-lg font-semibold text-gray-900">{formatPrice(data.summary.bucket31_60)}</div>
            <div className="text-xs text-gray-500 mt-1">31–60 días</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-lg font-semibold text-gray-900">{formatPrice(data.summary.bucket61plus)}</div>
            <div className="text-xs text-gray-500 mt-1">61+ días</div>
          </div>
        </div>
      )}

      <AdminTableShell
        loading={loading}
        isEmpty={!data || data.receivables.length === 0}
        emptyIcon={Landmark}
        emptyMessage="No hay facturas con saldo pendiente."
      >
        <table className="w-full">
          <thead>
            <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-2 text-left">N°</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Saldo</th>
              <th className="px-4 py-2 text-left">Antigüedad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.receivables.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                  {r.number ? `FAC-${String(r.number).padStart(4, '0')}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.clientName}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{formatDate(r.issueDate)}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{formatPrice(r.total)}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{formatPrice(r.balance)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BUCKET_COLOR[r.bucket]}`}>
                    {BUCKET_LABEL[r.bucket]} · {r.daysOld}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
