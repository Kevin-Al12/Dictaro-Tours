'use client';

// Piezas visuales compartidas por los módulos del panel (encabezado, avatar, estados, campos).
// Los estilos viven en src/app/admin/admin.css.

import type { LucideIcon } from 'lucide-react';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';

export function PageHeader({ title, subtitle, actions }: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-0">
        <h1 className="admin-display text-[23px] font-bold sm:text-[28px]" style={{ color: 'var(--a-fg)' }}>{title}</h1>
        {subtitle && <p className="mt-0.5" style={{ color: 'var(--a-muted)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const AVATAR_COLORS = ['#3f66a9', '#17804a', '#a86200', '#7a4fb5', '#b4232f', '#2a7d8c'];

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '·';
}

export function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="admin-avatar" style={{ background: AVATAR_COLORS[hash % AVATAR_COLORS.length] }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

// Nombre de persona con su avatar y, opcionalmente, una línea secundaria.
export function Who({ name, detail }: { name: string; detail?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} />
      <div className="min-w-0">
        <b className="block truncate font-semibold">{name}</b>
        {detail && <span className="block truncate text-xs" style={{ color: 'var(--a-muted)' }}>{detail}</span>}
      </div>
    </div>
  );
}

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className="admin-pill" data-tone={tone}>{children}</span>;
}

// Selector de estado que se ve como pastilla del color del estado.
export function StatusSelect({ value, options, tones, onChange, label }: {
  value: string;
  options: Record<string, string>;
  tones: Record<string, Tone>;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="admin-pill"
      data-tone={tones[value] ?? 'mute'}
    >
      {Object.entries(options).map(([key, text]) => (
        <option key={key} value={key}>{text}</option>
      ))}
    </select>
  );
}

export function IconButton({ icon: Icon, label, onClick, danger, disabled }: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="admin-icon-btn"
      data-danger={danger ? '' : undefined}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}

// Filtros rápidos tipo "chip" (Todas, Pendientes, ...).
export function FilterChips<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar">
      {options.map((o) => (
        <button key={o.value} type="button" className="admin-chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count !== undefined && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm" style={{ borderBottom: '1px solid var(--a-line)' }}>
      <span style={{ color: 'var(--a-muted)' }}>{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
