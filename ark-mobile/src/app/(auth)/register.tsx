import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { deviceTimezone, dialForCountry, guessCountryFromTimezone } from '@/lib/countries';
import { PillButton } from '@/components/ui/PillButton';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/store/auth';

// Email register form — collects backend's required fields (name/email/phone/password).
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const register = useAuth((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Seeded from the device's country rather than a hardcoded +971.
  const [phone, setPhone] = useState(dialForCountry(guessCountryFromTimezone(deviceTimezone())));
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErrors({});
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      // Let the gate route: a brand-new account has no lease yet → onboarding.
      router.replace('/');
    } catch (e: unknown) {
      // DRF returns { field: ["msg"] } — flatten so each inline error binds
      // to the matching input. Anything else gets routed through the shared
      // errorMessage helper and shown as a form-level message.
      const data = (e as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
          flat[k] = Array.isArray(v) ? String(v[0]) : String(v);
        }
        setErrors(flat);
      } else {
        setErrors({ form: errorMessage(e, 'Could not create account. Try again.') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // KeyboardAwareScrollView replaces the old KeyboardAvoidingView wrapper —
    // see the note in components/onboarding/TentzuScreen.tsx.
    <KeyboardAwareScrollView
      className="flex-1 bg-paper"
      bottomOffset={72}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
      }}
    >
        <Pressable onPress={() => router.back()} className="w-10 h-10 -ml-2 mb-4 justify-center">
          <Ionicons name="chevron-back" size={26} color="#000000" />
        </Pressable>

        <Text className="text-3xl font-bold text-ink tracking-tight">Create your account</Text>
        <Text className="text-base text-muted mt-1 mb-8">Just a few details to get started.</Text>

        <Input label="Full name" value={name} onChangeText={setName} error={errors.name} />
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
        <Input
          label="Phone (with country code)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
        />
        <Input
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password ?? errors.form}
        />

        <View className="flex-1" />

        <PillButton label="Create account" onPress={submit} loading={loading} className="mt-4" />

        <Text className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <Text className="text-ink font-semibold" onPress={() => router.replace('/(auth)/email')}>
            Log in
          </Text>
        </Text>
    </KeyboardAwareScrollView>
  );
}
