import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Step } from '@/components/ui/Step';
import { useOnboarding } from '@/store/onboarding';

export default function BuildingStep() {
  const { draft, set } = useOnboarding();
  const value = draft.building_name;

  return (
    <Step
      step={1}
      total={6}
      title="What's your building?"
      subtitle="Tell us the name of where you live."
      continueDisabled={value.trim().length < 2}
      onContinue={() => router.push('/(onboarding)/address')}
    >
      <Input
        label="Building name"
        placeholder="e.g. Marina Heights"
        value={value}
        onChangeText={(v) => set('building_name', v)}
        autoFocus
      />
    </Step>
  );
}
