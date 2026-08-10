import { View } from 'react-native';
import { Stack } from 'expo-router';

import { TentzuBackground } from '@/components/onboarding/TentzuBackground';

export default function AuthLayout() {
  return (
    // Backdrop mounted once for the whole auth stack rather than per screen:
    // it stays mounted across navigations, so the ambient plate does not
    // re-decode or flash between sign-in, email and register.
    <View style={{ flex: 1 }}>
      <TentzuBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          // Transparent so the shared backdrop shows through every auth screen.
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
