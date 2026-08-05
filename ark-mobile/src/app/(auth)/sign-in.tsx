import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SocialButton } from '@/components/ui/SocialButton';

// Landing auth screen — mirrors Cal AI "Create an account".
// Apple/Google are visual stubs for now; email is the functional path.
export default function SignInScreen() {
  const insets = useSafeAreaInsets();

  const notReady = () =>
    Alert.alert('Coming soon', 'Social sign-in is not wired up yet — use email for now.');

  return (
    <View
      className="flex-1 bg-paper px-5"
      style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 justify-center">
        <Text className="text-4xl font-bold text-ink tracking-tight">Create an account</Text>
        <Text className="text-base text-muted mt-2">Sign in to continue to Tentzu.</Text>
      </View>

      <View className="gap-3 mb-4">
        <SocialButton provider="apple" onPress={notReady} />
        <SocialButton provider="google" onPress={notReady} />

        <View className="flex-row items-center my-2">
          <View className="flex-1 h-px bg-line" />
          <Text className="text-xs text-muted mx-3">or</Text>
          <View className="flex-1 h-px bg-line" />
        </View>

        <Pressable onPress={() => router.push('/(auth)/email')} className="py-3">
          <Text className="text-center text-base font-semibold text-ink">
            Continue with email
          </Text>
        </Pressable>
      </View>

      <Text className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Text className="text-ink font-semibold" onPress={() => router.push('/(auth)/email')}>
          Log in
        </Text>
      </Text>
    </View>
  );
}
