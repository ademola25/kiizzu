import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton } from '@/components/ui/PillButton';
import { useOnboarding } from '@/store/onboarding';

export default function CelebrateStep() {
  const insets = useSafeAreaInsets();
  const reset = useOnboarding((s) => s.reset);

  const goToDashboard = () => {
    reset();
    router.replace('/(tabs)');
  };

  return (
    <View
      className="flex-1 bg-paper px-5"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-full bg-mist items-center justify-center mb-6">
          <Text className="text-5xl">🎉</Text>
        </View>
        <Text className="text-3xl font-bold text-ink tracking-tight text-center">
          You're all set
        </Text>
        <Text className="text-base text-muted mt-2 text-center px-6">
          Your cheque schedule is ready. We'll remind you before each one is due.
        </Text>
      </View>

      <PillButton label="Go to dashboard" onPress={goToDashboard} />
    </View>
  );
}
