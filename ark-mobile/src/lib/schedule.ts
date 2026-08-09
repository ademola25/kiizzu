// Client-side mirror of the backend cheque-schedule engine
// (ark-backend/schedule_engine/calculator.py) — used ONLY to preview the plan
// before submit. The authoritative schedule is generated server-side on
// POST /leases/create/.
import type { ChequePattern } from '@/store/onboarding';

export type PreviewCheque = {
  cheque_number: number;
  due_date: string; // YYYY-MM-DD
  amount: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/** Add `n` months to an ISO date, clamping the day to the target month's length
 *  (matches the backend's `_add_months` behaviour). */
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const targetIndex = m - 1 + n;
  const year = y + Math.floor(targetIndex / 12);
  const monthIndex0 = ((targetIndex % 12) + 12) % 12;
  const day = Math.min(d, daysInMonth(year, monthIndex0));
  const mm = String(monthIndex0 + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Even-split rounding to 2dp — same as the engine's ROUND_HALF_UP quantize. */
function perCheque(annual: number, pattern: ChequePattern): number {
  return Math.round((annual / pattern) * 100) / 100;
}

export function previewSchedule(
  startISO: string,
  pattern: ChequePattern,
  annual: number,
): PreviewCheque[] {
  const monthsBetween = 12 / pattern; // every pattern divides 12 → always integer
  const amount = perCheque(annual, pattern);
  return Array.from({ length: pattern }, (_, i) => ({
    cheque_number: i + 1,
    due_date: addMonths(startISO, i * monthsBetween),
    amount,
  }));
}

// —— formatting helpers ——

/** Re-exported so preview screens format money the same way the rest of the
 *  app does. Currency is per-lease — see lib/countries.ts. */
export { formatMoney } from './format';

/** "14 Jul 2026" */
export function formatLongDate(iso: string): string {
  if (!isValidISODate(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "14 Jul" */
export function formatShortDate(iso: string): string {
  if (!isValidISODate(iso)) return iso;
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function todayISO(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > daysInMonth(y, m - 1)) return false;
  return true;
}

export const patternLabel: Record<ChequePattern, { title: string; sub: string }> = {
  1: { title: 'Once a year', sub: 'Annual · a single payment' },
  2: { title: 'Twice a year', sub: 'Every 6 months' },
  3: { title: 'Three times a year', sub: 'Every 4 months' },
  4: { title: 'Four times a year', sub: 'Quarterly · every 3 months' },
  6: { title: 'Six times a year', sub: 'Every 2 months' },
  12: { title: 'Every month', sub: 'Monthly · 12 payments a year' },
};
