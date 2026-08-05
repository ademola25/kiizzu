import { View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuOption } from '@/components/onboarding/TentzuOption';
import { PayArt } from '@/components/onboarding/illustrations';
import { useOnboarding, type ChequePattern } from '@/store/onboarding';
import { patternLabel } from '@/lib/schedule';

const ORDER: ChequePattern[] = [1, 2, 3, 4, 6];

// Step 2/7 — cheque pattern. This single integer drives the whole schedule
// (count, spacing and per-cheque amount) on the backend.
export default function PatternStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const selected = draft.cheque_pattern;

  return (
    <TentzuScreen
      step={2}
      total={7}
      illustration={<PayArt />}
      title="How do you pay rent?"
      subtitle="Most Dubai leases are paid in a set number of cheques across the year. Pick yours."
      primaryLabel="Continue"
      primaryIcon="arrow-forward"
      primaryDisabled={selected === null}
      onPrimary={() => router.push('/(onboarding)/rent')}
    >
      <View style={{ gap: 12 }}>
        {ORDER.map((value) => (
          <TentzuOption
            key={value}
            icon="document-text-outline"
            title={patternLabel[value].title}
            subtitle={patternLabel[value].sub}
            selected={selected === value}
            onPress={() => set('cheque_pattern', value)}
          />
        ))}
      </View>
    </TentzuScreen>
  );
}
