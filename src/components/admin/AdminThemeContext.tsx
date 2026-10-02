'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AdminTheme = 'light' | 'dark';

// Clave propia (no la de next-themes) para que el tema del admin no cambie la web pública.
const STORAGE_KEY = 'ditaros-admin-theme';

interface AdminThemeContextValue {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    } catch {
      // Sin acceso a localStorage (modo privado, etc.): se queda en claro.
    }
  }, []);

  function setTheme(next: AdminTheme) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignorado: el tema igual cambia en esta sesión.
    }
  }

  return <AdminThemeContext.Provider value={{ theme, setTheme }}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error('useAdminTheme must be used within AdminThemeProvider');
  return ctx;
}
