import { create } from 'zustand';

import { countryByCode, deviceTimezone, guessCountryFromTimezone } from '@/lib/countries';
import { subdivisionName } from '@/lib/addressFormats';

// Lease fields match the backend POST /leases/create/ payload directly.
// `whatsapp_opted_in` is a *user* preference (PATCH /auth/me/), captured here
// during the survey and applied right after the account is created.
// Must divide 12 — the schedule engine spaces cheques 12/pattern months apart.
export type ChequePattern = 1 | 2 | 3 | 4 | 6 | 12;

export type OnboardingDraft = {
  building_name: string;
  area: string;
  city: string;
  /** ISO 3166-1 alpha-2 — drives every other address field, plus currency and dial code. */
  country: string;
  /** State / province / emirate code. Empty when the country has no subdivision. */
  subdivision: string;
  /** Postcode / ZIP / Eircode. Empty when the country has no postal system. */
  postal_code: string;
  unit_number: string;
  cheque_pattern: ChequePattern | null;
  start_date: string; // YYYY-MM-DD (first cheque due date)
  rent_amount: string; // string to preserve typed input; coerced on submit
  whatsapp_opted_in: boolean;

  // — added for the 14-step conversational journey (proposal Appendix C) —
  /** Step 5, skippable: who to call when something breaks. */
  contacts: Contact[];
  /** Step 6: local URI of the lease the user picked. Uploaded after sign-in,
   *  because every onboarding step before 14 is unauthenticated. */
  lease_document_uri: string | null;
  lease_document_name: string | null;
  lease_document_mime: string | null;
  lease_document_size: number | null;
  /** Set by finishOnboarding: did the upload actually succeed? null = not tried. */
  lease_document_stored: boolean | null;
  /** Step 8. */
  home_type: HomeType | '';
  /** Step 9: drives the 90/60/30-day renewal reminders we promise. */
  lease_end_date: string;
  /** Step 12, skippable: doc types the user wants to add after setup. */
  extra_docs: string[];
};

export type Contact = { label: string; name: string; phone: string };
export type HomeType = 'apartment' | 'villa' | 'townhouse' | 'commercial';

const empty: OnboardingDraft = {
  building_name: '',
  area: '',
  city: '',
  // Guessed from the device timezone so the common case needs no tapping;
  // the user can change it on the property step.
  country: guessCountryFromTimezone(deviceTimezone()),
  subdivision: '',
  postal_code: '',
  unit_number: '',
  cheque_pattern: null,
  start_date: '',
  rent_amount: '',
  whatsapp_opted_in: true, // reminders are the whole point; default on, toggle to opt out
  contacts: [],
  lease_document_uri: null,
  lease_document_name: null,
  lease_document_mime: null,
  lease_document_size: null,
  lease_document_stored: null,
  home_type: '',
  lease_end_date: '',
  extra_docs: [],
};

type OnboardingState = {
  draft: OnboardingDraft;
  set: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  reset: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  draft: empty,
  set: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
  reset: () => set({ draft: empty }),
}));

// The backend Lease has a single free-text `address` field in addition to the
// structured parts. We compose it from what the survey collects so the user
// never has to retype their address.
//
// Previously this appended a literal ", Dubai, UAE" to every address, which was
// wrong for every tenant outside the UAE. Parts are now filtered so an empty
// area or city cannot leave a dangling comma.
export function composeAddress(d: OnboardingDraft): string {
  const unit = d.unit_number.trim() ? `Unit ${d.unit_number.trim()}` : '';
  const region = d.subdivision ? subdivisionName(d.country, d.subdivision) : '';
  const country = countryByCode(d.country).name;
  return [
    unit,
    d.building_name.trim(),
    d.area.trim(),
    d.city.trim(),
    region,
    d.postal_code.trim(),
    country,
  ]
    .filter(Boolean)
    .join(', ');
}
