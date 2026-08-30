// Phone helpers, ported from ark-mobile/src/lib/phone.ts so the web waitlist
// and the mobile app agree on what a valid number is. Keep the two in step —
// and in step with validate_international_phone in ark/users/models.py — or one
// surface will accept numbers another rejects.
//
// We validate E.164 shape only and leave per-country length rules to the
// delivery provider: those rules vary by carrier and change over time, and
// guessing wrong locks real users out.

import { COUNTRIES, dialForCountry } from './countries'

/** E.164: "+", a country code never starting with 0, 8–15 digits total. */
export const E164 = /^\+[1-9]\d{7,14}$/

export function isValidPhone(value: string): boolean {
  return E164.test(value.trim())
}

/** Strip spaces, dashes, brackets — people paste numbers in all shapes. */
export function normalisePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '')
}

/**
 * Join a dial code and a local number into E.164.
 * Tolerates the user re-typing the dial code, or a leading national "0"
 * (common in the UK, Turkey, Australia) which must be dropped.
 */
export function composeE164(dial: string, local: string): string {
  const d = normalisePhone(dial)
  let n = normalisePhone(local)

  if (n.startsWith('+')) return n // already fully qualified — trust it

  const digits = d.slice(1)
  if (n.startsWith(d)) {
    n = n.slice(d.length)
  } else if (n.startsWith(digits) && n.length - digits.length >= 6) {
    // "44…" — the country code without the plus. Only strip it when enough
    // digits remain to still be a subscriber number: some national numbers
    // legitimately begin with their own country code's digits, and eating them
    // would silently store the wrong person's number.
    n = n.slice(digits.length)
  }

  // Leading national trunk "0" (UK, TR, AU, DE…) is not part of E.164.
  n = n.replace(/^0+/, '')
  return `${d}${n}`
}

/**
 * Split an E.164 number back into (country code, local part).
 * Longest dial code wins so +97 does not shadow +971.
 */
export function splitE164(value: string): { country: string; local: string } | null {
  const v = normalisePhone(value)
  if (!v.startsWith('+')) return null
  const best = COUNTRIES.filter((c) => v.startsWith(c.dial)).sort(
    (a, b) => b.dial.length - a.dial.length,
  )[0]
  if (!best) return null
  return { country: best.code, local: v.slice(best.dial.length) }
}

/** Placeholder that reflects the selected country. */
export function phonePlaceholder(countryCode: string): string {
  const samples: Record<string, string> = {
    '+971': '50 123 4567',
    '+44': '7911 123456',
    '+1': '415 555 2671',
    '+61': '412 345 678',
    '+91': '81234 56789',
    '+234': '802 123 4567',
    '+92': '301 2345678',
    '+63': '917 123 4567',
    '+20': '100 123 4567',
  }
  return samples[dialForCountry(countryCode)] ?? '123 456 789'
}
