import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = 'DOP') {
  // Montos redondos sin decimales; si hay centavos, siempre dos (RD$22,166.10, no RD$22,166.1).
  const hasCents = Math.round(price * 100) % 100 !== 0;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Fecha corta para tablas ("29 sep 2026"). Un "AAAA-MM-DD" se toma en hora local para no correrse un día.
export function formatShortDate(dateStr: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr);
  return date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function calculateDiscount(original: number, current: number) {
  return Math.round(((original - current) / original) * 100);
}
