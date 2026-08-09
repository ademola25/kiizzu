// Phone helpers. Mirrors the backend validator in ark/users/models.py —
// keep the two in step or the app will accept numbers the API rejects.
//
// Tentzu was UAE-only and hardcoded /^\+971\d{9}$/ in three separate screens,
// which rejected every non-UAE tenant. We validate E.164 shape only and leave
// per-country length rules to the delivery provider: those rules vary by
// carrier and change over time, and guessing wrong locks real users out.

import { COUNTRIES, dialForCountry } from './countries';

/** E.164: "+", a country code never starting with 0, 8–15 digits total. */
export const E164 = /^\+[1-9]\d{7,14}$/;

export function isValidPhone(value: string): boolean {
  return E164.test(value.trim());
}

/** Strip spaces, dashes, brackets — people paste numbers in all shapes. */
export function normalisePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '');
}

/**
 * Join a dial code and a local number into E.164.
 * Tolerates the user re-typing the dial code, or a leading national "0"
 * (common in the UK, Turkey, Australia) which must be dropped.
 */
export function composeE164(dial: string, local: string): string {
  const d = normalisePhone(dial); // e.g. "+90"
  let n = normalisePhone(local);

  if (n.startsWith('+')) return n; // already fully qualified — trust it

  const digits = d.slice(1); // "90"
  if (n.startsWith(d)) {
    // "+90…" typed into the local box
    n = n.slice(d.length);
  } else if (n.startsWith(digits) && n.length - digits.length >= 6) {
    // "90…" — the country code without the plus. Only strip it when enough
    // digits remain to still be a subscriber number: some national numbers
    // legitimately begin with their own country code's digits, and eating them
    // would silently dial the wrong person.
    n = n.slice(digits.length);
  }

  // Leading national trunk "0" (UK, TR, AU, DE…) is not part of E.164.
  n = n.replace(/^0+/, '');
  return `${d}${n}`;
}

/**
 * Split an E.164 number back into (country code, local part) for editing.
 * Longest dial code wins so +1 does not shadow nothing, and +97 does not
 * shadow +971. Returns null when nothing matches.
 */
export function splitE164(value: string): { country: string; local: string } | null {
  const v = normalisePhone(value);
  if (!v.startsWith('+')) return null;
  const matches = COUNTRIES.filter((c) => v.startsWith(c.dial)).sort(
    (a, b) => b.dial.length - a.dial.length,
  );
  const best = matches[0];
  if (!best) return null;
  return { country: best.code, local: v.slice(best.dial.length) };
}

/** Placeholder that reflects the selected country, e.g. "+44 7911 123456". */
export function phonePlaceholder(countryCode: string): string {
  const dial = dialForCountry(countryCode);
  const samples: Record<string, string> = {
    '+971': '50 123 4567',
    '+44': '7911 123456',
    '+1': '415 555 2671',
    '+61': '412 345 678',
    '+90': '530 123 4567',
  };
  return `${dial} ${samples[dial] ?? '123 456 789'}`;
}
