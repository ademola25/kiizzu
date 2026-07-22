import { View } from 'react-native';
import { router } from 'expo-router';
import { OptionCard } from '@/components/ui/OptionCard';
import { Step } from '@/components/ui/Step';
import { useOnboarding, type ChequePattern } from '@/store/onboarding';

// Tenant-language labels — keep numbers in description for clarity.
const OPTIONS: { value: ChequePattern; label: string; description: string }[] = [
  { value: 1, label: 'Annual', description: '1 cheque per year' },
  { value: 2, label: 'Bi-annual', description: '2 cheques per year' },
  { value: 3, label: '3 cheques', description: 'Every 4 months' },
  { value: 4, label: 'Quarterly', description: '4 cheques per year' },
  { value: 6, label: 'Bi-monthly', description: '6 cheques per year' },
];

export default function PatternStep() {
  const { draft, set } = useOnboarding();
  const selected = draft.cheque_pattern;

  return (
    <Step
      step={3}
      total={6}
      title="How do you pay rent?"
      subtitle="Choose your cheque pattern."
      continueDisabled={selected === null}
      onContinue={() => router.push('/(onboarding)/start-date')}
    >
      <View className="gap-3">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={selected === opt.value}
            onPress={() => set('cheque_pattern', opt.value)}
          />
        ))}
      </View>
    </Step>
  );
}
