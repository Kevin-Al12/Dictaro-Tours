'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ticket, Printer, MessageCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatShortDate } from '@/lib/utils';
import { useAdminList } from '@/hooks/useAdminList';
import AdminModal from './AdminModal';
import AdminTableShell from './AdminTableShell';
import { PageHeader, Who, Pill, FilterChips } from './ui';

interface Voucher {
  id: string;
  code: string;
  client: string;
  clientPhone: string;
  clientEmail: string;
  service: string;
  supplier: string | null;
  date: string | null;
  pax: number;
  locator: string | null;
  sentAt: string | null;
}

type Filter = 'todos' | 'pendientes' | 'enviados';

// Número para wa.me: solo dígitos; los 10 dígitos locales (809/829/849) llevan el 1 delante.
function waNumber(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length === 10 ? `1${digits}` : digits;
}

function sentLabel(sentAt: string) {
  const d = new Date(sentAt);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'hoy';
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }).replace('.', '');
}

function whatsappMessage(v: Voucher, agency: string) {
  return [
    `Hola ${v.client}, le saluda ${agency}.`,
    `Le compartimos su voucher ${v.code}: ${v.service}${v.supplier ? ` con ${v.supplier}` : ''}.`,
    v.date ? `Fecha: ${formatDate(v.date)}.` : '',
    `Pasajeros: ${v.pax}.`,
    v.locator ? `Localizador: ${v.locator}.` : '',
    'Presente este voucher al proveedor. ¡Buen viaje!',
  ].filter(Boolean).join('\n');
}

export default function VouchersPanel() {
  const { data: vouchers, loading, reload } = useAdminList<Voucher>('/api/admin/vouchers', 'vouchers');
  const [filter, setFilter] = useState<Filter>('todos');
  const [viewing, setViewing] = useState<Voucher | null>(null);
  const [agency, setAgency] = useState("D'Itaros Tours");
  const [agencyLine, setAgencyLine] = useState('');

  useEffect(() => {
    fetch('/api/admin/company-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const s = json?.settings;
        if (!s) return;
        if (s.legalName) setAgency(s.legalName);
        setAgencyLine([s.rnc ? `RNC ${s.rnc}` : '', s.address ?? ''].filter(Boolean).join(' · '));
      })
      .catch(() => {});
  }, []);

  const pending = vouchers.filter((v) => !v.sentAt).length;
  const visible = useMemo(
    () => vouchers.filter((v) => filter === 'todos' || (filter === 'enviados' ? Boolean(v.sentAt) : !v.sentAt)),
    [vouchers, filter],
  );

  async function sendWhatsApp(v: Voucher) {
    const phone = waNumber(v.clientPhone);
    if (!phone) {
      toast.error('La reserva no tiene teléfono del cliente');
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage(v, agency))}`, '_blank', 'noopener');
    const res = await fetch(`/api/admin/vouchers/${v.id}`, { method: 'POST' });
    if (!res.ok) {
      toast.error('No se pudo marcar el voucher como enviado');
      return;
    }
    const { sentAt } = await res.json();
    setViewing((cur) => (cur && cur.id === v.id ? { ...cur, sentAt } : cur));
    toast.success('Voucher marcado como enviado');
    reload();
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader title="Vouchers" subtitle="Se generan solos desde la reserva, con el logo de la agencia." />

      <AdminTableShell
        loading={loading}
        isEmpty={visible.length === 0}
        emptyIcon={Ticket}
        emptyMessage={vouchers.length === 0 ? 'Aún no hay vouchers. Aparecen cuando una reserva se confirma.' : 'Ningún voucher coincide con el filtro.'}
        toolbar={
          <FilterChips<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos', count: vouchers.length },
              { value: 'pendientes', label: 'Por enviar', count: pending },
              { value: 'enviados', label: 'Enviados', count: vouchers.length - pending },
            ]}
          />
        }
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Voucher</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Enviado</th>
              <th className="r"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((v) => (
              <tr key={v.id}>
                <td className="nowrap font-mono text-xs">{v.code}</td>
                <td><Who name={v.client} detail={v.clientPhone || v.clientEmail} /></td>
                <td className="muted">
                  <span className="block">{v.service}</span>
                  {v.supplier && <span className="block text-xs">{v.supplier}</span>}
                </td>
                <td className="nowrap admin-num">{v.date ? formatShortDate(v.date) : <span className="muted">Sin fecha</span>}</td>
                <td className="nowrap">
                  {v.sentAt ? <Pill tone="ok">Enviado {sentLabel(v.sentAt)}</Pill> : <Pill tone="mute">Por enviar</Pill>}
                </td>
                <td className="r">
                  <button type="button" className="admin-btn" data-size="sm" onClick={() => setViewing(v)}>
                    <Eye className="h-3.5 w-3.5" />Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Voucher ${viewing.code}` : ''}
        subtitle={viewing?.client}
        maxWidth="max-w-2xl"
      >
        {viewing && (
          <>
            {/* Al imprimir solo sale el voucher, sin el panel alrededor. */}
            <style>{`@media print {
              body * { visibility: hidden !important; }
              #voucher-print, #voucher-print * { visibility: visible !important; }
              #voucher-print { position: fixed; inset: 0; padding: 32px; background: #fff; color: #111; }
            }`}</style>
            <div id="voucher-print" className="rounded-xl p-5" style={{ border: '1px solid var(--a-line)' }}>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--a-line)' }}>
                <div className="flex items-center gap-3">
                  <span className="admin-display grid h-10 w-10 place-items-center rounded-[10px] text-xl font-bold" style={{ background: '#c41e2c', color: '#fff' }}>D&apos;</span>
                  <div>
                    <b className="admin-display block text-base leading-tight">{agency}</b>
                    {agencyLine && <small style={{ color: 'var(--a-muted)' }}>{agencyLine}</small>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold tracking-wider" style={{ color: 'var(--a-muted)' }}>VOUCHER</span>
                  <span className="admin-display admin-num block text-2xl font-bold">{viewing.code}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-8 pt-2 sm:grid-cols-2">
                <VoucherField label="Cliente" value={viewing.client} />
                <VoucherField label="Servicio" value={viewing.service} />
                <VoucherField label="Proveedor" value={viewing.supplier || '—'} />
                <VoucherField label="Localizador" value={viewing.locator || '—'} mono />
                <VoucherField label="Fecha" value={viewing.date ? formatDate(viewing.date) : 'Sin fecha'} />
                <VoucherField label="Pasajeros" value={String(viewing.pax)} />
              </div>

              <p className="mt-4 rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: 'var(--a-surface-2)' }}>
                Presente este voucher al proveedor.
              </p>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {viewing.sentAt && <span className="text-xs sm:mr-auto" style={{ color: 'var(--a-muted)' }}>Enviado el {formatDate(viewing.sentAt)}</span>}
              <button type="button" className="admin-btn" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />Imprimir
              </button>
              <button type="button" className="admin-btn" data-variant="primary" onClick={() => sendWhatsApp(viewing)}>
                <MessageCircle className="h-4 w-4" />Enviar por WhatsApp
              </button>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}

function VoucherField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="py-2.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
      <span className="block text-xs font-semibold" style={{ color: 'var(--a-muted)' }}>{label}</span>
      <span className={`block font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
