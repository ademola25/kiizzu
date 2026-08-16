import { View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuOption } from '@/components/onboarding/TentzuOption';
import { useOnboarding } from '@/store/onboarding';

const DOCS: { id: string; title: string; sub: string; icon: 'card-outline' | 'flash-outline' | 'shield-outline' | 'document-outline' }[] = [
  { id: 'tenancy', title: 'Tenancy registration', sub: 'Ejari, contract registration or equivalent', icon: 'document-outline' },
  { id: 'utilities', title: 'Utility bills', sub: 'Electricity, water, internet', icon: 'flash-outline' },
  { id: 'insurance', title: 'Insurance', sub: 'Contents or tenancy cover', icon: 'shield-outline' },
  { id: 'id', title: 'ID documents', sub: 'Passport, national ID, visa', icon: 'card-outline' },
];

/**
 * Step 13/14 — "Want me to save anything else?"
 *
 * Skippable. This does not upload anything: it records what the user wants to
 * keep, so the Documents tab can prompt for exactly those after setup. Asking
 * for four more files before an account exists would be the single worst place
 * in the flow to add friction.
 */
export default function ExtrasStep() {
  const extras = useOnboarding((s) => s.draft.extra_docs);
  const set = useOnboarding((s) => s.set);

  const toggle = (id: string) =>
    set('extra_docs', extras.includes(id) ? extras.filter((x) => x !== id) : [...extras, id]);

  const next = () => router.push('/(onboarding)/save');

  return (
    <TentzuScreen
      step={13}
      total={14}
      title="Want me to save anything else?"
      subtitle="Pick what you'd like kept safe and I'll ask for it after setup. You can add anything, anytime."
      primaryLabel={extras.length ? "I'll add these" : 'Continue'}
      primaryIcon="arrow-forward"
      onPrimary={next}
      secondaryLabel="Not right now"
      onSecondary={() => {
        set('extra_docs', []);
        next();
      }}
    >
      <View style={{ gap: 12 }}>
        {DOCS.map((d) => (
          <TentzuOption
            key={d.id}
            icon={d.icon}
            title={d.title}
            subtitle={d.sub}
            selected={extras.includes(d.id)}
            onPress={() => toggle(d.id)}
          />
        ))}
      </View>
    </TentzuScreen>
  );
}
