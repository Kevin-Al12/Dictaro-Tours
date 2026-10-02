'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export interface PaletteItem {
  id: string;
  label: string;
  section: string;
  hint?: string;
  run: () => void;
}

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
}

export default function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return q ? items.filter((it) => normalize(`${it.label} ${it.hint ?? ''} ${it.section}`).includes(q)) : items;
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setSelected(0), [query]);

  if (!open) return null;

  function choose(item: PaletteItem | undefined) {
    if (!item) return;
    onClose();
    item.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      choose(results[selected]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  let lastSection = '';
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] pb-4"
      style={{ background: 'rgba(10,12,22,.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label="Buscar en el panel"
        className="w-full max-w-[560px] overflow-hidden rounded-xl"
        style={{ background: 'var(--a-surface)', border: '1px solid var(--a-line)', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
      >
        <div className="flex items-center gap-2 px-4" style={{ borderBottom: '1px solid var(--a-line)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--a-faint)' }} />
          <input
            id="admin-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Busca una sección o acción…"
            autoComplete="off"
            className="w-full bg-transparent py-3.5 text-[15px] outline-none"
            style={{ color: 'var(--a-fg)' }}
          />
        </div>
        <div className="max-h-[340px] overflow-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-3 text-sm" style={{ color: 'var(--a-faint)' }}>Sin resultados</p>
          )}
          {results.map((item, i) => {
            const header = item.section !== lastSection ? item.section : null;
            lastSection = item.section;
            return (
              <div key={item.id}>
                {header && (
                  <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.09em]" style={{ color: 'var(--a-faint)' }}>
                    {header}
                  </p>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => choose(item)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm"
                  style={{ background: i === selected ? 'var(--a-surface-2)' : 'transparent', color: 'var(--a-fg)' }}
                >
                  {item.label}
                  {item.hint && <span className="ml-auto text-[11.5px]" style={{ color: 'var(--a-faint)' }}>{item.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
