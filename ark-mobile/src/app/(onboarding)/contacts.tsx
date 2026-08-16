import { View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { useOnboarding, type Contact } from '@/store/onboarding';

const SLOTS: { label: string; namePlaceholder: string }[] = [
  { label: 'Landlord or agent', namePlaceholder: 'e.g. Aisha' },
  { label: 'Building or security', namePlaceholder: 'e.g. Front desk' },
  { label: 'Maintenance', namePlaceholder: 'e.g. Cool Air AC' },
];

/**
 * Step 6/14 — "Who do I call if something breaks?"
 *
 * Name AND number per contact. An earlier version collected only a number and
 * used the descriptive hint as the placeholder, so the field read "The person
 * you chase about the lease" while opening a numeric keypad — it asked for a
 * name and made it impossible to type one.
 *
 * Skippable: nobody has these to hand at signup, and blocking on them costs
 * more users than the data is worth.
 */
export default function ContactsStep() {
  const contacts = useOnboarding((s) => s.draft.contacts);
  const set = useOnboarding((s) => s.set);

  const valueFor = (label: string) => contacts.find((c) => c.label === label);

  const update = (label: string, field: 'name' | 'phone', v: string) => {
    const next: Contact[] = SLOTS.map((slot) => {
      const existing = valueFor(slot.label) ?? { label: slot.label, name: '', phone: '' };
      return slot.label === label ? { ...existing, [field]: v } : existing;
      // Keep a contact only once it carries something useful.
    }).filter((c) => c.name.trim() || c.phone.trim());
    set('contacts', next);
  };

  const next = () => router.push('/(onboarding)/lease');
  const filled = contacts.filter((c) => c.name.trim() || c.phone.trim()).length;

  return (
    <TentzuScreen
      step={6}
      total={14}
      title="Who do I call if something breaks?"
      subtitle="Add whoever you'd ring first. Or skip — I'll help you find them later."
      primaryLabel={filled ? `Save ${filled === 1 ? 'this' : 'these'}` : 'Continue'}
      primaryIcon="arrow-forward"
      onPrimary={next}
      secondaryLabel="Skip for now"
      onSecondary={next}
    >
      {SLOTS.map((slot) => {
        const c = valueFor(slot.label);
        return (
          <View key={slot.label} style={{ marginBottom: 6 }}>
            <TentzuField
              label={slot.label}
              placeholder={slot.namePlaceholder}
              value={c?.name ?? ''}
              onChangeText={(v) => update(slot.label, 'name', v)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TentzuField
              placeholder="Phone number"
              value={c?.phone ?? ''}
              onChangeText={(v) => update(slot.label, 'phone', v)}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
            />
          </View>
        );
      })}
    </TentzuScreen>
  );
}
