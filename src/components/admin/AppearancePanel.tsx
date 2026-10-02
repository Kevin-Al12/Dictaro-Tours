'use client';

import { Moon, Sun } from 'lucide-react';
import { useAdminTheme, type AdminTheme } from './AdminThemeContext';

const OPTIONS: { value: AdminTheme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
];

export default function AppearancePanel() {
  const { theme, setTheme } = useAdminTheme();

  return (
    <section className="admin-card">
      <div className="flex flex-wrap items-center gap-4 px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-bold" style={{ color: 'var(--a-fg)' }}>Apariencia</h2>
          <p className="text-sm" style={{ color: 'var(--a-muted)' }}>
            Elige cómo se ve el panel. Se recuerda en este equipo.
          </p>
        </div>
        <div
          role="group"
          aria-label="Apariencia"
          className="ml-auto inline-flex gap-0.5 rounded-[9px] p-[3px]"
          style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-line)' }}
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(value)}
                className="inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors"
                style={
                  active
                    ? { background: 'var(--a-surface)', color: 'var(--a-fg)', boxShadow: 'var(--a-shadow)' }
                    : { color: 'var(--a-muted)' }
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
