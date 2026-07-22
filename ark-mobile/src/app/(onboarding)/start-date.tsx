import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Step } from '@/components/ui/Step';
import { useOnboarding } from '@/store/onboarding';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function StartDateStep() {
  const { draft, set } = useOnboarding();
  const value = draft.start_date;
  const valid = ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));

  return (
    <Step
      step={4}
      total={6}
      title="When does your lease start?"
      subtitle="Use YYYY-MM-DD format for now."
      continueDisabled={!valid}
      onContinue={() => router.push('/(onboarding)/rent')}
    >
      <Input
        label="Lease start date"
        placeholder="2026-01-01"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        value={value}
        onChangeText={(v) => set('start_date', v)}
        error={value.length >= 10 && !valid ? 'Use YYYY-MM-DD (e.g. 2026-01-01)' : undefined}
      />
    </Step>
  );
}
