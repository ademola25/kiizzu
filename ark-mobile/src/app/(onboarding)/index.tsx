import { Redirect } from 'expo-router';

// The onboarding group always enters at the "Meet Tentzu" welcome screen.
export default function OnboardingEntry() {
  return <Redirect href="/(onboarding)/welcome" />;
}
