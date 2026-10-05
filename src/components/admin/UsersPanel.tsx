'use client';

import { useEffect, useState } from 'react';
import { formatShortDate } from '@/lib/utils';
import { Who, Pill } from './ui';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  detail: string;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Administradora',
  admin: 'Administración',
  vendedor: 'Ventas',
};

const ROLE_CAN: Record<string, string> = {
  owner: 'Todo',
  admin: 'Todo',
  vendedor: 'Cotizar, reservar y ver clientes',
};

// "Hoy 9:02", "Ayer 17:20" o "12 sep".
function when(iso: string) {
  const d = new Date(iso);
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Hoy ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Ayer ${time}`;
  if (d.getFullYear() !== today.getFullYear()) return formatShortDate(iso).replace(' de ', ' ');
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }).replace('.', '');
}

function CardHeader({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
      <h2 className="text-[14.5px] font-bold">{title}</h2>
      {aside && <span className="ml-auto text-xs" style={{ color: 'var(--a-muted)' }}>{aside}</span>}
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--a-faint)' }}>{children}</p>;
}

export default function UsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch('/api/admin/audit').then((r) => (r.ok ? r.json() : Promise.reject(r))),
    ])
      .then(([u, a]) => {
        setUsers(u.users ?? []);
        setEntries(a.entries ?? []);
      })
      .catch(() => setError(true));
  }, []);

  const loadingText = error ? 'No se pudo cargar la información.' : 'Cargando…';

  return (
    <>
      <section className="admin-card overflow-hidden">
        <CardHeader title="Usuarios y permisos" aside="Para agregar usuarios usa el script create-admin por ahora." />
        {!users ? (
          <Placeholder>{loadingText}</Placeholder>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Puede</th>
                  <th>Verificación en dos pasos</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><Who name={u.name} detail={u.email} /></td>
                    <td className="nowrap"><Pill tone="mute">{ROLE_LABEL[u.role] ?? u.role}</Pill></td>
                    <td className="muted">{ROLE_CAN[u.role] ?? '—'}</td>
                    <td className="nowrap"><Pill tone="warn">Próximamente</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid var(--a-line)' }}>
          <h2 className="text-[14.5px] font-bold">Bitácora de cambios</h2>
          <span className="ml-auto rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--a-surface-2)', color: 'var(--a-muted)' }}>
            Nadie puede borrarla
          </span>
        </div>
        {!entries ? (
          <Placeholder>{loadingText}</Placeholder>
        ) : entries.length === 0 ? (
          <Placeholder>Todavía no hay cambios registrados.</Placeholder>
        ) : (
          <ol className="flex flex-col">
            {entries.map((e, i) => (
              <li
                key={e.id}
                className="grid grid-cols-[110px_1fr] gap-3.5 px-4 py-3 text-[13px]"
                style={i < entries.length - 1 ? { borderBottom: '1px solid var(--a-line)' } : undefined}
              >
                <time dateTime={e.createdAt} className="admin-num" style={{ color: 'var(--a-faint)' }}>{when(e.createdAt)}</time>
                <div><b className="font-semibold">{e.actorName}</b> {e.detail.charAt(0).toLowerCase() + e.detail.slice(1)}</div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
