import { Redirect } from 'expo-router';

// Entry into the onboarding flow — always start at building.
export default function OnboardingEntry() {
  return <Redirect href="/(onboarding)/building" />;
}
