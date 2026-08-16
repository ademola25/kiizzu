import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { useOnboarding, type Contact } from '@/store/onboarding';

const SLOTS: { label: string; hint: string }[] = [
  { label: 'Landlord or agent', hint: 'The person you chase about the lease' },
  { label: 'Building or security', hint: 'Front desk, watchman, building office' },
  { label: 'Maintenance', hint: 'AC, plumbing, whoever you call when it breaks' },
];

/**
 * Step 6/14 — "Who do I call if something breaks?"
 *
 * Skippable by design (proposal: steps 5 and 12 are skippable). Nobody has these
 * numbers to hand during signup, and blocking on them would cost more users than
 * the data is worth. The skip copy promises to help later, and means it.
 */
export default function ContactsStep() {
  const contacts = useOnboarding((s) => s.draft.contacts);
  const set = useOnboarding((s) => s.set);

  const valueFor = (label: string) => contacts.find((c) => c.label === label);

  const update = (label: string, field: 'name' | 'phone', v: string) => {
    const next: Contact[] = SLOTS.map((slot) => {
      const existing = valueFor(slot.label) ?? { label: slot.label, name: '', phone: '' };
      return slot.label === label ? { ...existing, [field]: v } : existing;
    }).filter((c) => c.name.trim() || c.phone.trim());
    set('contacts', next);
  };

  const next = () => router.push('/(onboarding)/lease');

  return (
    <TentzuScreen
      step={6}
      total={14}
      title="Who do I call if something breaks?"
      subtitle="Add whoever you'd ring first. Or skip — I'll help you find them later."
      primaryLabel={contacts.length ? 'Save these' : 'Continue'}
      primaryIcon="arrow-forward"
      onPrimary={next}
      secondaryLabel="Skip for now"
      onSecondary={next}
    >
      {SLOTS.map((slot) => {
        const c = valueFor(slot.label);
        return (
          <TentzuField
            key={slot.label}
            label={slot.label}
            placeholder={slot.hint}
            value={c?.name ?? ''}
            onChangeText={(v) => update(slot.label, 'name', v)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        );
      })}
    </TentzuScreen>
  );
}
