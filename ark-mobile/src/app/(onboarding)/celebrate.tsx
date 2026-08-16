import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { TentzuButton } from '@/components/onboarding/TentzuButton';
import { MascotHero } from '@/components/onboarding/MascotHero';
import { TentzuBackground } from '@/components/onboarding/TentzuBackground';
import { useOnboarding } from '@/store/onboarding';
import { tentzu, tentzuFont } from '@/theme/tokens';

const MASCOT = require('../../../assets/images/mascot-tentzu-full.png');

// Final screen — the payoff. Clears the draft and opens the dashboard.
export default function CelebrateStep() {
  const insets = useSafeAreaInsets();
  const reset = useOnboarding((s) => s.reset);

  const goToDashboard = () => {
    reset();
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <TentzuBackground variant="warm" />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 26 }}>
        <MascotHero source={MASCOT} height={300} />
        <Text
          style={{
            fontFamily: tentzuFont.headline,
            fontSize: 29,
            lineHeight: 35,
            letterSpacing: -0.6,
            color: tentzu.ink,
            textAlign: 'center',
            marginTop: 26,
          }}
        >
          You're all set. Here's what I'm watching.
        </Text>
        <Text
          style={{
            fontFamily: tentzuFont.body,
            fontSize: 15,
            lineHeight: 23,
            color: tentzu.inkVariant,
            textAlign: 'center',
            marginTop: 12,
            maxWidth: 330,
            alignSelf: 'center',
          }}
        >
          Your payment plan is saved and your documents are safe with me. I'll ping you well
          before each one is due. From now on, just ask me anything.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <TentzuButton label="Show me my dashboard" onPress={goToDashboard} icon="arrow-forward" />
      </View>
    </View>
  );
}
