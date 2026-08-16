import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/auth';
import { tentzu } from '@/theme/tokens';

// Auth/onboarding gate: bootstrap runs in root _layout; we just react.
//  - loading                        → spinner
//  - signedOut                      → /(onboarding) (survey-first; account is created at the end)
//  - signedIn + !onboarding_complete → /(onboarding) (resume — finishes at "Save your Tentzu")
//  - signedIn + onboarded            → /(tabs)
export default function Entry() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const reason = useAuth((s) => s.signedOutReason);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tentzu.bg }}>
        <ActivityIndicator color={tentzu.primary} />
      </View>
    );
  }
  if (status === 'signedOut') {
    // Someone who just logged out has an account — send them where they can use
    // it. A fresh install, or an account just deleted, starts at the beginning.
    // Routing every signed-out user into the survey is what made logging out
    // look like it had silently failed.
    if (reason === 'logout') return <Redirect href="/(auth)/email" />;
    return <Redirect href="/(onboarding)" />;
  }
  if (!user?.onboarding_complete) return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(tabs)" />;
}
