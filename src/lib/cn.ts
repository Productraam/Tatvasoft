import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and de-duplicate conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian-locale currency (₹) with grouping. */
export function formatCurrency(value: number, opts?: { paise?: boolean }): string {
  const safe = Number.isFinite(value) ? value : 0;
  const base = `₹${safe.toLocaleString('en-IN')}`;
  return opts?.paise ? `${base}.00` : base;
}

/** Format an ISO date (yyyy-mm-dd) or Date as a readable string. */
export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
