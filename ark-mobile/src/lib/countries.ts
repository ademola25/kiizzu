// Country reference data: dial code for phone entry, ISO-4217 currency for
// rent amounts, and the display name/flag for pickers.
//
// Tentzu launched UAE-only — phone validation was `+971` and every amount was
// printed as AED. This table is what makes the app work anywhere. The lease
// stores `country` and `currency` so a tenant can hold leases in more than one
// place without the app guessing.
//
// Ordering: the launch markets first (they cover most users), then the rest
// alphabetically. `SUGGESTED` drives the short list at the top of the picker.

export type Country = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  /** E.164 calling code, with the leading + */
  dial: string;
  /** ISO 4217 */
  currency: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', currency: 'AED', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', currency: 'GBP', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', currency: 'USD', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', currency: 'AUD', flag: '🇦🇺' },
  { code: 'TR', name: 'Türkiye', dial: '+90', currency: 'TRY', flag: '🇹🇷' },

  { code: 'AR', name: 'Argentina', dial: '+54', currency: 'ARS', flag: '🇦🇷' },
  { code: 'AT', name: 'Austria', dial: '+43', currency: 'EUR', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', dial: '+32', currency: 'EUR', flag: '🇧🇪' },
  { code: 'BH', name: 'Bahrain', dial: '+973', currency: 'BHD', flag: '🇧🇭' },
  { code: 'BR', name: 'Brazil', dial: '+55', currency: 'BRL', flag: '🇧🇷' },
  { code: 'CH', name: 'Switzerland', dial: '+41', currency: 'CHF', flag: '🇨🇭' },
  { code: 'CN', name: 'China', dial: '+86', currency: 'CNY', flag: '🇨🇳' },
  { code: 'CZ', name: 'Czechia', dial: '+420', currency: 'CZK', flag: '🇨🇿' },
  { code: 'DE', name: 'Germany', dial: '+49', currency: 'EUR', flag: '🇩🇪' },
  { code: 'DK', name: 'Denmark', dial: '+45', currency: 'DKK', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', dial: '+20', currency: 'EGP', flag: '🇪🇬' },
  { code: 'ES', name: 'Spain', dial: '+34', currency: 'EUR', flag: '🇪🇸' },
  { code: 'FI', name: 'Finland', dial: '+358', currency: 'EUR', flag: '🇫🇮' },
  { code: 'FR', name: 'France', dial: '+33', currency: 'EUR', flag: '🇫🇷' },
  { code: 'GH', name: 'Ghana', dial: '+233', currency: 'GHS', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', dial: '+30', currency: 'EUR', flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', currency: 'HKD', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', dial: '+36', currency: 'HUF', flag: '🇭🇺' },
  { code: 'ID', name: 'Indonesia', dial: '+62', currency: 'IDR', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', dial: '+353', currency: 'EUR', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dial: '+972', currency: 'ILS', flag: '🇮🇱' },
  { code: 'IN', name: 'India', dial: '+91', currency: 'INR', flag: '🇮🇳' },
  { code: 'IT', name: 'Italy', dial: '+39', currency: 'EUR', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', dial: '+81', currency: 'JPY', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', dial: '+254', currency: 'KES', flag: '🇰🇪' },
  { code: 'KW', name: 'Kuwait', dial: '+965', currency: 'KWD', flag: '🇰🇼' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', currency: 'EUR', flag: '🇱🇺' },
  { code: 'MA', name: 'Morocco', dial: '+212', currency: 'MAD', flag: '🇲🇦' },
  { code: 'MX', name: 'Mexico', dial: '+52', currency: 'MXN', flag: '🇲🇽' },
  { code: 'MY', name: 'Malaysia', dial: '+60', currency: 'MYR', flag: '🇲🇾' },
  { code: 'NG', name: 'Nigeria', dial: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'NL', name: 'Netherlands', dial: '+31', currency: 'EUR', flag: '🇳🇱' },
  { code: 'NO', name: 'Norway', dial: '+47', currency: 'NOK', flag: '🇳🇴' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', currency: 'NZD', flag: '🇳🇿' },
  { code: 'OM', name: 'Oman', dial: '+968', currency: 'OMR', flag: '🇴🇲' },
  { code: 'PH', name: 'Philippines', dial: '+63', currency: 'PHP', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', dial: '+92', currency: 'PKR', flag: '🇵🇰' },
  { code: 'PL', name: 'Poland', dial: '+48', currency: 'PLN', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dial: '+351', currency: 'EUR', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', dial: '+974', currency: 'QAR', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', dial: '+40', currency: 'RON', flag: '🇷🇴' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', currency: 'SAR', flag: '🇸🇦' },
  { code: 'SE', name: 'Sweden', dial: '+46', currency: 'SEK', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapore', dial: '+65', currency: 'SGD', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', dial: '+66', currency: 'THB', flag: '🇹🇭' },
  { code: 'UA', name: 'Ukraine', dial: '+380', currency: 'UAH', flag: '🇺🇦' },
  { code: 'ZA', name: 'South Africa', dial: '+27', currency: 'ZAR', flag: '🇿🇦' },
];

/** Shown at the top of the picker — the markets we are launching into. */
export const SUGGESTED = ['AE', 'GB', 'US', 'CA', 'AU', 'TR'];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export const DEFAULT_COUNTRY = 'AE';

export function countryByCode(code: string | null | undefined): Country {
  return (code ? BY_CODE.get(code) : undefined) ?? BY_CODE.get(DEFAULT_COUNTRY)!;
}

export function currencyForCountry(code: string | null | undefined): string {
  return countryByCode(code).currency;
}

export function dialForCountry(code: string | null | undefined): string {
  return countryByCode(code).dial;
}

/**
 * Best-effort country guess from the device.
 *
 * Uses the IANA timezone rather than the locale: locale tells you the language
 * someone reads in, not where they live — an expat in Dubai with an en-GB phone
 * would be guessed as the UK. It is only a default; every screen lets the user
 * change it.
 */
export function guessCountryFromTimezone(tz: string): string {
  const zone = TZ_TO_COUNTRY[tz];
  return zone && BY_CODE.has(zone) ? zone : DEFAULT_COUNTRY;
}

const TZ_TO_COUNTRY: Record<string, string> = {
  'Asia/Dubai': 'AE',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Lisbon': 'PT',
  'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Athens': 'GR',
  'Europe/Kyiv': 'UA',
  'Europe/Istanbul': 'TR',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Pacific/Auckland': 'NZ',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Karachi': 'PK',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Singapore': 'SG',
  'Asia/Hong_Kong': 'HK',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Bangkok': 'TH',
  'Asia/Manila': 'PH',
  'Asia/Jakarta': 'ID',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jerusalem': 'IL',
  'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Accra': 'GH',
  'Africa/Casablanca': 'MA',
  'Africa/Johannesburg': 'ZA',
};

/** The device's IANA timezone, e.g. "Europe/London". Falls back to Dubai. */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dubai';
  } catch {
    return 'Asia/Dubai';
  }
}
