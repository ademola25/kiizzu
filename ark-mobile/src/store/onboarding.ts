import { create } from 'zustand';

// Lease fields match the backend POST /leases/create/ payload directly.
// `whatsapp_opted_in` is a *user* preference (PATCH /auth/me/), captured here
// during the survey and applied right after the account is created.
export type ChequePattern = 1 | 2 | 3 | 4 | 6;

export type OnboardingDraft = {
  building_name: string;
  area: string;
  unit_number: string;
  cheque_pattern: ChequePattern | null;
  start_date: string; // YYYY-MM-DD (first cheque due date)
  rent_amount: string; // string to preserve typed input; coerced on submit
  whatsapp_opted_in: boolean;
};

const empty: OnboardingDraft = {
  building_name: '',
  area: '',
  unit_number: '',
  cheque_pattern: null,
  start_date: '',
  rent_amount: '',
  whatsapp_opted_in: true, // reminders are the whole point; default on, toggle to opt out
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
export function composeAddress(d: OnboardingDraft): string {
  const unit = d.unit_number.trim() ? `Unit ${d.unit_number.trim()}, ` : '';
  return `${unit}${d.building_name.trim()}, ${d.area.trim()}, Dubai, UAE`;
}
