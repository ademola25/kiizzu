import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/auth';

// Auth/onboarding gate: bootstrap runs in root _layout; we just react.
//  - loading → spinner
//  - signedOut → /(auth)/welcome (Kizu landing → Get Started → sign-in)
//  - signedIn + !onboarding_complete → /(onboarding)
//  - signedIn + onboarded → /(tabs)
export default function Entry() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color="#000000" />
      </View>
    );
  }
  if (status === 'signedOut') return <Redirect href="/(auth)/welcome" />;
  if (!user?.onboarding_complete) return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(tabs)" />;
}
