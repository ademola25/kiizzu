import '@/global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_700Bold_Italic,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_600SemiBold,
} from '@expo-google-fonts/be-vietnam-pro';

import { initPushNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/query';
import { useAuth } from '@/store/auth';

// Wire up the foreground handler and Android channel before any push could
// arrive. Last-writer-wins on the runtime side, so a Fast-Refresh re-run
// in dev is harmless; in production this runs once at JS bundle load.
initPushNotifications();

export default function RootLayout() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_700Bold_Italic,
    PlusJakartaSans_800ExtraBold,
    BeVietnamPro_400Regular,
    BeVietnamPro_600SemiBold,
  });

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Who is allowed to see the dashboard. Declared here and enforced by the
  // router itself (Stack.Protected) rather than by redirects.
  //
  // Redirect-based gating is what broke logout: (tabs)/_layout redirected to
  // "/", index redirected on to the login screen, and because a *layout* stays
  // mounted through the transition it redirected again — an infinite loop that
  // pegged the JS thread ("Maximum update depth exceeded"). The UI froze, so
  // Log out and Delete account read as dead buttons even though the press had
  // registered and the session had already been cleared.
  //
  // Protected has no such failure mode: when the guard turns false the screen
  // is removed from the navigator and the router falls back to the anchor
  // (index) on its own. No screen navigates, so no two screens can disagree.
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const canSeeApp = status === 'signedIn' && !!user?.onboarding_complete;

  // Hold first paint until brand fonts are ready so the welcome/landing
  // screen never flashes a fallback typeface.
  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {/* KeyboardProvider is required by react-native-keyboard-controller.
          Android 15 (API 35) stopped resizing the window for adjustResize, and
          Expo enables edge-to-edge by default from SDK 53 — together that made
          the stock KeyboardAvoidingView a no-op on Android, so the keyboard sat
          on top of whatever field you were typing into. */}
      <KeyboardProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#eaf4f5' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Protected guard={canSeeApp}>
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
            <Stack.Screen name="billing-return" />
          </Stack>
        </SafeAreaProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
