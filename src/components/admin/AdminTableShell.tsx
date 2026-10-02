'use client';

import type { LucideIcon } from 'lucide-react';

interface AdminTableShellProps {
  loading: boolean;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyMessage: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminTableShell({ loading, isEmpty, emptyIcon: EmptyIcon, emptyMessage, children }: AdminTableShellProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400">Cargando...</div>
      ) : isEmpty ? (
        <div className="py-6 text-center">
          <EmptyIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
