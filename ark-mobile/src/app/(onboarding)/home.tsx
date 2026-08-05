import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { HomeArt } from '@/components/onboarding/illustrations';
import { useOnboarding } from '@/store/onboarding';

const TOTAL = 7;

// Step 1/7 — where you rent. Feeds Lease.building_name / area / unit_number.
export default function HomeStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);

  const ready =
    draft.building_name.trim().length >= 2 &&
    draft.area.trim().length >= 2 &&
    draft.unit_number.trim().length >= 1;

  return (
    <TentzuScreen
      step={1}
      total={TOTAL}
      illustration={<HomeArt />}
      title="Where do you rent?"
      subtitle="Tell Tentzu about your place so your reminders feel personal."
      primaryLabel="Continue"
      primaryIcon="arrow-forward"
      primaryDisabled={!ready}
      onPrimary={() => router.push('/(onboarding)/pattern')}
    >
      <TentzuField
        label="Building or community"
        placeholder="e.g. Marina Heights"
        value={draft.building_name}
        onChangeText={(v) => set('building_name', v)}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TentzuField
        label="Area"
        placeholder="e.g. Dubai Marina"
        value={draft.area}
        onChangeText={(v) => set('area', v)}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TentzuField
        label="Unit number"
        placeholder="e.g. 1204"
        value={draft.unit_number}
        onChangeText={(v) => set('unit_number', v)}
        autoCapitalize="characters"
        returnKeyType="done"
      />
    </TentzuScreen>
  );
}
