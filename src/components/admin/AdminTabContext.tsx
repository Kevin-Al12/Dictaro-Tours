'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface AdminTabContextValue {
  tab: string;
  setTab: (tab: string) => void;
}

const AdminTabContext = createContext<AdminTabContextValue | null>(null);

export function AdminTabProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState('dashboard');
  return <AdminTabContext.Provider value={{ tab, setTab }}>{children}</AdminTabContext.Provider>;
}

export function useAdminTab() {
  const ctx = useContext(AdminTabContext);
  if (!ctx) throw new Error('useAdminTab must be used within AdminTabProvider');
  return ctx;
}
