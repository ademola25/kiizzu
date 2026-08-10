import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { PillButton } from '@/components/ui/PillButton';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/store/auth';

// Email login form. Tap "Sign up" to switch to the register screen.
export default function EmailLoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Let the gate decide: onboarded → tabs, not-onboarded → onboarding.
      router.replace('/');
    } catch (e: unknown) {
      setError(errorMessage(e, 'Login failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    // KeyboardAwareScrollView, not KeyboardAvoidingView: Android 15 stopped
    // resizing the window for adjustResize and Expo defaults to edge-to-edge,
    // which together made the stock component a no-op on Android.
    <KeyboardAwareScrollView
      bottomOffset={72}
      keyboardShouldPersistTaps="handled"
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <Pressable onPress={() => router.back()} className="w-10 h-10 -ml-2 mb-4 justify-center">
          <Ionicons name="chevron-back" size={26} color="#000000" />
        </Pressable>

        <Text className="text-3xl font-bold text-ink tracking-tight">Welcome back</Text>
        <Text className="text-base text-muted mt-1 mb-8">Log in with your email.</Text>

        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
        />

        <Pressable
          onPress={() => router.push('/(auth)/forgot-password')}
          hitSlop={6}
          className="self-end py-1"
        >
          <Text className="text-sm font-semibold text-brand">Forgot password?</Text>
        </Pressable>

        <View className="flex-1" />

        <PillButton label="Log in" onPress={submit} loading={loading} />

        <Text className="text-center text-sm text-muted mt-4">
          Don't have an account?{' '}
          <Text
            className="text-ink font-semibold"
            onPress={() => router.replace('/(auth)/register')}
          >
            Sign up
          </Text>
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}
