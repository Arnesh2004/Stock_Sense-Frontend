export const money = (v: number, currency: 'INR' | 'USD' = 'INR', compact = false): string =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(v);

export const pct = (v: number, digits = 1): string =>
  `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`;

export const num = (v: number, digits = 2): string => (Number.isFinite(v) ? v.toFixed(digits) : '∞');

export const tone = (v: number): string => (v > 0 ? 'text-[var(--pos)]' : v < 0 ? 'text-[var(--neg)]' : '');

export const cn = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ');
