import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Step } from '@/components/ui/Step';
import { useOnboarding } from '@/store/onboarding';

export default function RentStep() {
  const { draft, set } = useOnboarding();
  const amount = Number(draft.rent_amount.replace(/,/g, ''));
  const valid = Number.isFinite(amount) && amount > 0;

  return (
    <Step
      step={5}
      total={6}
      title="What's your annual rent?"
      subtitle="The total amount across all cheques."
      continueDisabled={!valid}
      onContinue={() => router.push('/(onboarding)/review')}
    >
      <Input
        label="Annual rent (AED)"
        placeholder="90,000"
        keyboardType="numeric"
        value={draft.rent_amount}
        onChangeText={(v) => set('rent_amount', v)}
      />
    </Step>
  );
}
