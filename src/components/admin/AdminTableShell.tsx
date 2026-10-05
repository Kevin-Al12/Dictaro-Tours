'use client';

import type { LucideIcon } from 'lucide-react';

interface AdminTableShellProps {
  loading: boolean;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyMessage: React.ReactNode;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminTableShell({ loading, isEmpty, emptyIcon: EmptyIcon, emptyMessage, emptyAction, toolbar, children }: AdminTableShellProps) {
  return (
    <section className="admin-card overflow-hidden">
      {toolbar && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--a-line)' }}>
          {toolbar}
        </div>
      )}
      {loading ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--a-faint)' }}>Cargando…</div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: 'var(--a-surface-2)', color: 'var(--a-faint)' }}>
            <EmptyIcon className="h-5 w-5" />
          </span>
          <p className="max-w-sm text-sm" style={{ color: 'var(--a-muted)' }}>{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </section>
  );
}
