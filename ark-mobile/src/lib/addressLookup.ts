// Address autocomplete and postcode lookup.
//
// DESIGN RULE: this is an accelerator, never a gate. Every field it fills can be
// typed by hand, and every failure here is silent. The services are free and
// keyless, and Photon's own terms say "extensive usage will be throttled" with
// no availability guarantee — so the form must be fully usable when they are
// slow, rate-limited, or down, and offline.
//
// Providers (all verified keyless, 2026-08):
//   Photon (photon.komoot.io)  — worldwide type-ahead, OSM data
//   postcodes.io              — UK, richer + partial-postcode autocomplete
//   Zippopotam                — postcode -> city/state for ~60 countries
//
// Upgrade path when volume justifies it: Geoapify (3k/day free, keyed) or
// Google Places. Swap the two functions below; nothing else needs to change.

import { addressFormat } from './addressFormats';

export type AddressSuggestion = {
  /** One-line label to show in the list. */
  label: string;
  street: string;
  houseNumber: string;
  city: string;
  postcode: string;
  /** Region name as the provider spells it — may not match our subdivision codes. */
  state: string;
  countryCode: string;
};

const TIMEOUT_MS = 6000;
const UA = 'Tentzu/1.0 (rent reminder app)';

async function getJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': UA },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Offline, timeout, rate-limited, malformed — all the same to the caller.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Type-ahead address suggestions, biased to the selected country.
 *
 * Photon has no country filter, so we constrain with the country's bounding box
 * and then drop anything that still came back from elsewhere — a bbox around
 * the US inevitably catches parts of Canada and Mexico.
 */
export async function searchAddress(
  query: string,
  countryCode: string,
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const [minLon, minLat, maxLon, maxLat] = addressFormat(countryCode).bbox;
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
    `&limit=8&lang=en&bbox=${minLon},${minLat},${maxLon},${maxLat}`;

  const data = await getJson(url);
  const features: any[] = data?.features ?? [];

  return features
    .map((f) => {
      const p = f?.properties ?? {};
      return {
        label: buildLabel(p),
        street: p.street ?? p.name ?? '',
        houseNumber: p.housenumber ?? '',
        city: p.city ?? p.town ?? p.village ?? p.district ?? '',
        postcode: p.postcode ?? '',
        state: p.state ?? '',
        countryCode: p.countrycode ?? '',
      } as AddressSuggestion;
    })
    .filter((s) => s.countryCode === countryCode)
    .filter((s) => s.label.length > 0);
}

function buildLabel(p: any): string {
  const line1 = [p.housenumber, p.street ?? p.name].filter(Boolean).join(' ');
  return [line1, p.city ?? p.town ?? p.village, p.postcode].filter(Boolean).join(', ');
}

export type PostcodeResult = {
  city: string;
  /** Provider's region name — matched to our subdivision codes by the caller. */
  state: string;
  postcode: string;
};

/**
 * Resolve a postcode to its city/region so the user does not retype them.
 * Tries the UK-specific service first (it is the most accurate), then the
 * multi-country one, then falls back to a Photon search.
 */
export async function lookupPostcode(
  code: string,
  countryCode: string,
): Promise<PostcodeResult | null> {
  const pc = code.trim();
  if (pc.length < 3) return null;

  if (countryCode === 'GB') {
    const d = await getJson(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(pc.replace(/\s+/g, ''))}`,
    );
    const r = d?.result;
    if (r) return { city: r.post_town ?? r.admin_district ?? '', state: r.region ?? '', postcode: r.postcode ?? pc };
  }

  const z = await getJson(
    `https://api.zippopotam.us/${countryCode.toLowerCase()}/${encodeURIComponent(pc)}`,
  );
  const place = z?.places?.[0];
  if (place) {
    return {
      city: place['place name'] ?? '',
      state: place['state'] ?? '',
      postcode: z['post code'] ?? pc,
    };
  }

  // Last resort: treat the postcode as a search term.
  const hits = await searchAddress(pc, countryCode);
  const hit = hits.find((h) => h.city);
  return hit ? { city: hit.city, state: hit.state, postcode: hit.postcode || pc } : null;
}

/** Partial-postcode suggestions. UK only — no other free service offers this. */
export async function suggestPostcodes(prefix: string, countryCode: string): Promise<string[]> {
  if (countryCode !== 'GB' || prefix.trim().length < 2) return [];
  const d = await getJson(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(prefix.replace(/\s+/g, ''))}/autocomplete`,
  );
  return Array.isArray(d?.result) ? d.result.slice(0, 8) : [];
}

/**
 * Match a provider's free-text region ("Ontario", "England") to one of our
 * subdivision codes. Returns null when there is no confident match — better to
 * leave the dropdown untouched than to select the wrong province for someone.
 */
export function matchSubdivision(countryCode: string, providerState: string): string | null {
  const spec = addressFormat(countryCode).subdivision;
  if (!spec || !providerState) return null;
  const needle = providerState.trim().toLowerCase();
  const exact = spec.options.find(
    (o) => o.name.toLowerCase() === needle || o.code.toLowerCase() === needle,
  );
  if (exact) return exact.code;
  const partial = spec.options.filter(
    (o) => o.name.toLowerCase().includes(needle) || needle.includes(o.name.toLowerCase()),
  );
  return partial.length === 1 ? partial[0].code : null;
}
