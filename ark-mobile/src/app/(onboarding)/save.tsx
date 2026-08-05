import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { SaveArt } from '@/components/onboarding/illustrations';
import { useAuth } from '@/store/auth';
import { finishOnboarding } from '@/lib/finishOnboarding';
import { errorMessage } from '@/lib/errors';
import { tentzu, tentzuFont } from '@/theme/tokens';

const PHONE_RE = /^\+971\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = 'create' | 'login';

// Step 7/7 — the account wall. Passing through here (create OR log in) is the
// only way to the dashboard. After auth we require a verified email, then
// finishOnboarding saves the lease.
export default function SaveStep() {
  const status = useAuth((s) => s.status);
  const register = useAuth((s) => s.register);
  const login = useAuth((s) => s.login);
  const refreshUser = useAuth((s) => s.refreshUser);
  const resendVerification = useAuth((s) => s.resendVerification);

  const alreadySignedIn = status === 'signedIn';

  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+971');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cleanPhone = phone.replace(/\s/g, '');
  const createValid =
    name.trim().length >= 2 &&
    EMAIL_RE.test(email.trim()) &&
    PHONE_RE.test(cleanPhone) &&
    password.length >= 6;
  const loginValid = EMAIL_RE.test(email.trim()) && password.length >= 1;
  const canSubmit = alreadySignedIn || (mode === 'create' ? createValid : loginValid);

  // Once authenticated: require a verified email before the dashboard. Route to
  // the verify screen (with the dev code when available) or finish onboarding.
  const routeAfterAuth = async (registerDevCode?: string) => {
    await refreshUser();
    if (!useAuth.getState().user?.email_verified) {
      const dev = registerDevCode ?? (await resendVerification());
      router.replace({
        pathname: '/(onboarding)/verify-email',
        params: dev ? { dev } : {},
      });
      return;
    }
    await finishOnboarding();
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      let registerDevCode: string | undefined;
      if (!alreadySignedIn) {
        if (mode === 'create') {
          try {
            registerDevCode = await register({
              name: name.trim(),
              email: email.trim(),
              phone: cleanPhone,
              password,
            });
          } catch (e: unknown) {
            const data = (e as { response?: { data?: { email?: unknown } } })?.response?.data;
            if (data?.email) {
              setMode('login');
              setPassword('');
              setError('That email already has an account — log in to save your plan.');
              setLoading(false);
              return;
            }
            throw e;
          }
        } else {
          await login(email.trim(), password);
        }
      }
      await routeAfterAuth(registerDevCode);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel = alreadySignedIn
    ? 'Continue'
    : mode === 'create'
      ? 'Create account'
      : 'Log in';

  return (
    <TentzuScreen
      step={7}
      total={7}
      illustration={<SaveArt />}
      title={alreadySignedIn ? 'Finish setup' : 'Save your rent plan'}
      subtitle={
        alreadySignedIn
          ? 'Confirm and Tentzu will start tracking your cheques right away.'
          : 'Create a free account (or log in) to unlock your dashboard and start your reminders.'
      }
      primaryLabel={primaryLabel}
      primaryIcon="arrow-forward"
      primaryDisabled={!canSubmit}
      primaryLoading={loading}
      onPrimary={submit}
      footerNote={
        error ? (
          <View style={{ backgroundColor: tentzu.dangerBg, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontFamily: tentzuFont.body, fontSize: 13.5, color: tentzu.danger }}>{error}</Text>
          </View>
        ) : (
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 12.5, color: tentzu.mutedInk, textAlign: 'center' }}>
            No spam — just reminders before your rent is due.
          </Text>
        )
      }
    >
      {alreadySignedIn ? (
        <View style={{ backgroundColor: tentzu.tintSurface, borderRadius: 14, padding: 16 }}>
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 14, color: tentzu.inkVariant }}>
            You're signed in. Tap below to save your rent plan and open your dashboard.
          </Text>
        </View>
      ) : (
        <>
          <Segmented mode={mode} onChange={setMode} />

          {mode === 'create' ? (
            <>
              <TentzuField
                label="Full name"
                placeholder="e.g. Amina Rahman"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
              <TentzuField
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TentzuField
                label="WhatsApp / phone"
                placeholder="+9715XXXXXXXX"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                hint="UAE number, format +971 followed by 9 digits."
              />
              <TentzuField
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </>
          ) : (
            <>
              <TentzuField
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TentzuField
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                hitSlop={6}
                style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
              >
                <Text style={{ fontFamily: tentzuFont.label, fontSize: 13.5, color: tentzu.primary }}>
                  Forgot password?
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}
    </TentzuScreen>
  );
}

function Segmented({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: tentzu.tintSurface,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
      }}
    >
      {(['create', 'login'] as const).map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: active ? tentzu.white : 'transparent',
              shadowColor: tentzu.primary,
              shadowOpacity: active ? 0.12 : 0,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text
              style={{
                fontFamily: tentzuFont.label,
                fontSize: 14,
                color: active ? tentzu.primary : tentzu.mutedInk,
              }}
            >
              {m === 'create' ? 'Create account' : 'Log in'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
