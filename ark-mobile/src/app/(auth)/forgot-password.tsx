import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { TentzuCodeInput } from '@/components/onboarding/TentzuCodeInput';
import { SaveArt } from '@/components/onboarding/illustrations';
import { confirmPasswordReset, requestPasswordReset } from '@/lib/passwordReset';
import { useAuth } from '@/store/auth';
import { errorMessage } from '@/lib/errors';
import { tentzu, tentzuFont } from '@/theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Two-step password reset: request a code, then set a new password. On success
// we log the user straight in and let the gate route them.
export default function ForgotPasswordScreen() {
  const login = useAuth((s) => s.login);

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const dev = await requestPasswordReset(email);
      setDevCode(dev);
      setStep('reset');
    } catch (e: unknown) {
      setError(errorMessage(e, "Couldn't send a reset code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(email, code, password);
      // Prove it worked by logging straight in, then hand off to the gate.
      await login(email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      setError(errorMessage(e, 'That code is invalid or expired. Try again or resend.'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <TentzuScreen
        illustration={<SaveArt />}
        title="Reset your password"
        subtitle="Enter your account email and we'll send you a 6-digit reset code."
        primaryLabel="Send reset code"
        primaryIcon="arrow-forward"
        primaryDisabled={!EMAIL_RE.test(email.trim())}
        primaryLoading={loading}
        onPrimary={requestCode}
        onBack={() => router.back()}
        footerNote={
          error ? <ErrorNote message={error} /> : undefined
        }
      >
        <TentzuField
          label="Email"
          placeholder="you@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
        />
      </TentzuScreen>
    );
  }

  return (
    <TentzuScreen
      illustration={<SaveArt />}
      title="Choose a new password"
      subtitle={`Enter the code we sent to ${email} and your new password.`}
      primaryLabel="Reset password"
      primaryIcon="checkmark"
      primaryDisabled={code.length !== 6 || password.length < 6}
      primaryLoading={loading}
      onPrimary={resetPassword}
      onBack={() => setStep('request')}
      footerNote={error ? <ErrorNote message={error} /> : undefined}
    >
      <Text style={{ fontFamily: tentzuFont.label, fontSize: 13, color: tentzu.inkVariant, marginBottom: 8, marginLeft: 2 }}>
        Reset code
      </Text>
      <TentzuCodeInput value={code} onChange={setCode} autoFocus />

      <View style={{ height: 20 }} />

      <TentzuField
        label="New password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password-new"
      />

      {/* Not gated on __DEV__ — see the note in (onboarding)/verify-email.tsx. */}
      {devCode ? (
        <View
          style={{
            marginTop: 4,
            backgroundColor: tentzu.tintSurface,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: tentzu.primary,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 12, color: tentzu.inkVariant, textAlign: 'center' }}>
            Testing mode — email delivery isn&apos;t configured yet, so your code is:
          </Text>
          <Text
            style={{ fontFamily: tentzuFont.headlineBold, fontSize: 26, letterSpacing: 4, color: tentzu.primary }}
            accessibilityLabel={`Your reset code is ${devCode.split('').join(' ')}`}
            selectable
          >
            {devCode}
          </Text>
        </View>
      ) : null}
    </TentzuScreen>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <View style={{ backgroundColor: tentzu.dangerBg, borderRadius: 12, padding: 12 }}>
      <Text style={{ fontFamily: tentzuFont.body, fontSize: 13.5, color: tentzu.danger }}>{message}</Text>
    </View>
  );
}
