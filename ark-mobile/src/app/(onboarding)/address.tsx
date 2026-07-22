import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Step } from '@/components/ui/Step';
import { useOnboarding } from '@/store/onboarding';

export default function AddressStep() {
  const { draft, set } = useOnboarding();
  const ready =
    draft.area.trim().length > 1 &&
    draft.unit_number.trim().length > 0 &&
    draft.address.trim().length > 4;

  return (
    <Step
      step={2}
      total={6}
      title="Where is it?"
      subtitle="A few details about the location."
      continueDisabled={!ready}
      onContinue={() => router.push('/(onboarding)/pattern')}
    >
      <Input
        label="Area / District"
        placeholder="e.g. Dubai Marina"
        value={draft.area}
        onChangeText={(v) => set('area', v)}
      />
      <Input
        label="Unit number"
        placeholder="e.g. 1204"
        value={draft.unit_number}
        onChangeText={(v) => set('unit_number', v)}
      />
      <Input
        label="Full address"
        placeholder="Street, area, emirate"
        value={draft.address}
        onChangeText={(v) => set('address', v)}
        multiline
      />
    </Step>
  );
}
