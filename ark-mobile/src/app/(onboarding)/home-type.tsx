import { View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuOption } from '@/components/onboarding/TentzuOption';
import { useOnboarding, type HomeType } from '@/store/onboarding';

const TYPES: { value: HomeType; title: string; sub: string; icon: 'business-outline' | 'home-outline' | 'storefront-outline' }[] = [
  { value: 'apartment', title: 'Apartment', sub: 'A flat in a building or tower', icon: 'business-outline' },
  { value: 'villa', title: 'Villa', sub: 'A standalone house with its own plot', icon: 'home-outline' },
  { value: 'townhouse', title: 'Townhouse', sub: 'A house sharing walls with neighbours', icon: 'home-outline' },
  { value: 'commercial', title: 'Commercial', sub: 'An office, shop or unit', icon: 'storefront-outline' },
];

/**
 * Step 9/14 — "Looks like you're in an apartment."
 *
 * Phrased as a confirmation with apartment pre-selected, per the proposal's
 * "confirm, don't ask". Once the lease is parsed (Phase 3) the default comes
 * from the document; until then it is the commonest answer, which is still a
 * better starting point than an empty form.
 */
export default function HomeTypeStep() {
  const selected = useOnboarding((s) => s.draft.home_type);
  const set = useOnboarding((s) => s.set);
  const value = selected || 'apartment';

  return (
    <TentzuScreen
      step={9}
      total={14}
      title="Looks like you're in an apartment."
      subtitle="That's my best guess. Tap a different one if I've got it wrong."
      primaryLabel="That's right"
      primaryIcon="arrow-forward"
      onPrimary={() => {
        if (!selected) set('home_type', 'apartment');
        router.push('/(onboarding)/lease-end');
      }}
    >
      <View style={{ gap: 12 }}>
        {TYPES.map((t) => (
          <TentzuOption
            key={t.value}
            icon={t.icon}
            title={t.title}
            subtitle={t.sub}
            selected={value === t.value}
            onPress={() => set('home_type', t.value)}
          />
        ))}
      </View>
    </TentzuScreen>
  );
}
