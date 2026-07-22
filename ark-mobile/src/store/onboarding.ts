import { create } from 'zustand';

// Field shapes match the backend POST /leases/ payload directly.
export type ChequePattern = 1 | 2 | 3 | 4 | 6;

export type OnboardingDraft = {
  building_name: string;
  area: string;
  unit_number: string;
  address: string;
  cheque_pattern: ChequePattern | null;
  start_date: string; // YYYY-MM-DD
  rent_amount: string; // string to preserve typed input; coerced on submit
};

const empty: OnboardingDraft = {
  building_name: '',
  area: '',
  unit_number: '',
  address: '',
  cheque_pattern: null,
  start_date: '',
  rent_amount: '',
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
