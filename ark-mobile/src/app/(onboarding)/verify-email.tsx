import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuCodeInput } from '@/components/onboarding/TentzuCodeInput';
import { MascotHero } from '@/components/onboarding/MascotHero';
import { mascotPortrait } from '@/components/onboarding/mascots';
import { useAuth } from '@/store/auth';
import { finishOnboarding } from '@/lib/finishOnboarding';
import { errorMessage } from '@/lib/errors';
import { tentzu, tentzuFont } from '@/theme/tokens';

const RESEND_COOLDOWN = 30;

// Email verification — the hard gate between creating an account and reaching
// the dashboard. On success it hands off to finishOnboarding (saves the lease).
export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ dev?: string }>();
  const email = useAuth((s) => s.user?.email) ?? 'your email';
  const verifyEmail = useAuth((s) => s.verifyEmail);
  const resendVerification = useAuth((s) => s.resendVerification);

  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>(params.dev);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const submittedFor = useRef<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const verify = async (value: string) => {
    if (loading || submittedFor.current === value) return; // guard double-submit
    submittedFor.current = value;
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(value);
      await finishOnboarding();
    } catch (e: unknown) {
      setError(errorMessage(e, 'That code is invalid or expired. Try again or resend.'));
      setCode('');
      submittedFor.current = null;
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      const next = await resendVerification();
      setDevCode(next);
      setCode('');
      setCooldown(RESEND_COOLDOWN);
    } catch (e: unknown) {
      setError(errorMessage(e, "Couldn't resend the code. Please try again."));
    }
  };

  return (
    <TentzuScreen
      illustration={<MascotHero source={mascotPortrait} height={200} />}
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}. Enter it to secure your account and unlock your dashboard.`}
      primaryLabel="Verify & continue"
      primaryIcon="arrow-forward"
      primaryDisabled={code.length !== 6}
      primaryLoading={loading}
      onPrimary={() => verify(code)}
    >
      <TentzuCodeInput value={code} onChange={setCode} onComplete={verify} autoFocus />

      {error ? (
        <Text
          style={{ fontFamily: tentzuFont.body, fontSize: 13.5, color: tentzu.danger, marginTop: 16, textAlign: 'center' }}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ alignItems: 'center', marginTop: 22 }}>
        <Pressable onPress={resend} disabled={cooldown > 0} hitSlop={8}>
          <Text
            style={{
              fontFamily: tentzuFont.label,
              fontSize: 14,
              color: cooldown > 0 ? tentzu.mutedInk : tentzu.primary,
            }}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>

      {__DEV__ && devCode ? (
        <Text
          style={{ fontFamily: tentzuFont.body, fontSize: 12, color: tentzu.mutedInk, marginTop: 18, textAlign: 'center' }}
        >
          Dev build · your code is {devCode}
        </Text>
      ) : null}
    </TentzuScreen>
  );
}
