// Shared formatters — keep numbers/dates consistent across screens.
//
// Date math is done by *string-part arithmetic* against the YYYY-MM-DD that
// the backend stores (no timezone). Parsing via `new Date('YYYY-MM-DD')`
// would be UTC-midnight per spec, which renders as the previous day in
// UTC-negative zones and yields off-by-one `daysUntil` results. Working
// directly off the parts keeps us aligned with Dubai-stored dates regardless
// of the device timezone.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** "2.4 MB" / "812 KB" / "640 B" — human-readable file size. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '— B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * "AED 90,000" / "£1,450" / "CA$2,100" — whole amounts, grouped.
 *
 * Currency comes from the lease, not from a hardcoded AED: leases exist outside
 * the UAE now. Falls back to a plain "<CODE> <amount>" if the runtime's Intl
 * data lacks the currency — Hermes ships a trimmed ICU on some Android builds,
 * and a thrown RangeError here would blank the dashboard's hero number.
 */
export function formatMoney(value: number | string, currency = 'AED'): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return `${currency} —`;
  try {
    return n.toLocaleString(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch {
    return `${currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}

/**
 * "1 Jan 2026" from a full ISO datetime (e.g. `2026-05-15T14:32:00Z`).
 * Use this for timestamp fields like `uploaded_at` / `created_at` — the
 * date-only `formatDate` rejects datetimes outright.
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "1 Jan 2026" from a YYYY-MM-DD date string. Falls back to raw on parse failure. */
export function formatDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  const [y, m, d] = parts;
  // Construct via UTC to bypass local-TZ interpretation of YYYY-MM-DD.
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Whole days from today to the given ISO date. Negative when past-due. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const parts = parseIsoDate(iso);
  if (!parts) return 0;
  const [y, m, d] = parts;
  const targetUtc = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetUtc - todayUtc) / MS_PER_DAY);
}

/**
 * "Today" / "Yesterday" / "1 Jan 2026" from a YYYY-MM-DD day key.
 * Designed to consume the output of `localDayKey` directly — works off
 * numeric date parts so a device-tz change mid-session can't lie about
 * "Today" via a Date-string round-trip.
 */
export function formatDayKey(dayKey: string, now: Date = new Date()): string {
  const parts = parseIsoDate(dayKey);
  if (!parts) return dayKey;
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((today - target) / MS_PER_DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "14:32" — short time-of-day for timestamps next to a reminder row. */
export function formatTimeOfDay(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * "2026-01-15" — for grouping reminders by calendar day (device-local).
 * Returns `'unknown'` on parse failure so a bad record can't masquerade as
 * its own raw-ISO section header in the UI.
 */
export function localDayKey(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return [y, m, d];
}
