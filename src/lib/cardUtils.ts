export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720))/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(?:011|5)/.test(digits)) return 'discover';
  return 'unknown';
}

export const brandLabel: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  unknown: '',
};

export function cardLength(brand: CardBrand): number {
  return brand === 'amex' ? 15 : 16;
}

export function cvvLength(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3;
}

export function groupSizes(brand: CardBrand): number[] {
  return brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
}

export function sanitizeDigits(raw: string, brand: CardBrand): string {
  return raw.replace(/\D/g, '').slice(0, cardLength(brand));
}

export function formatCardNumber(digits: string, brand: CardBrand): string {
  const groups = groupSizes(brand);
  const out: string[] = [];
  let i = 0;
  for (const len of groups) {
    const chunk = digits.slice(i, i + len);
    if (!chunk) break;
    out.push(chunk);
    i += len;
  }
  return out.join(' ');
}

export function maskedCardNumber(digits: string, brand: CardBrand): string {
  const groups = groupSizes(brand);
  let i = 0;
  return groups
    .map((len) => {
      const chunk = digits.slice(i, i + len);
      i += len;
      return chunk.padEnd(len, '•');
    })
    .join('  ');
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
