import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useInvalidateSubscription } from '@/api/billing';
import { PillButton } from '@/components/ui/PillButton';
import { colors } from '@/theme/tokens';
import { useAuth } from '@/store/auth';

/**
 * Safety-net landing for the Stripe checkout return URL. On the happy path
 * `openAuthSessionAsync` auto-closes the browser before this route ever
 * resolves; this screen only renders if the user opened the link from
 * outside the in-app browser or the auto-close didn't fire.
 */
export default function BillingReturn() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ status?: string }>();
  const invalidateSubscription = useInvalidateSubscription();
  const status = useAuth((s) => s.status);

  const success = params.status === 'success';

  // Drop the cached subscription so Settings reflects the new tier on land.
  useEffect(() => {
    if (success && status === 'signedIn') invalidateSubscription();
  }, [success, status, invalidateSubscription]);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  // Deep link is publicly reachable; punt a signed-out visitor to sign-in
  // rather than into the authenticated tabs.
  if (status === 'signedOut') return <Redirect href="/(auth)/sign-in" />;

  return (
    <View
      className="flex-1 bg-paper px-5"
      style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-full bg-mist items-center justify-center mb-6">
          <Ionicons
            name={success ? 'checkmark-circle' : 'close-circle'}
            size={56}
            color={colors.ink}
            accessibilityLabel={success ? 'Upgrade successful' : 'Checkout cancelled'}
          />
        </View>
        <Text className="text-3xl font-bold text-ink tracking-tight text-center">
          {success ? "You're upgraded" : 'Checkout cancelled'}
        </Text>
        <Text className="text-base text-muted mt-2 text-center px-6">
          {success
            ? 'Starter is activating — it should appear on your Settings screen in a moment.'
            : 'No worries — you can upgrade any time from Settings.'}
        </Text>
      </View>

      <PillButton
        label="Back to settings"
        onPress={() => router.replace('/(tabs)/settings')}
      />
    </View>
  );
}
