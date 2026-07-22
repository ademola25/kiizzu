import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // funnel-style: no swipe back mid-flow
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.paper },
      }}
    />
  );
}
