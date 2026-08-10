import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MascotHero } from '@/components/onboarding/MascotHero';
import { TentzuBackground } from '@/components/onboarding/TentzuBackground';
import { tentzu, tentzuFont } from '@/theme/tokens';

const MASCOT = require('../../../assets/images/mascot-assistant.png');

// Step 1 — "Meet Tentzu". Friendly mascot hero up top; all copy sits below it on
// a clean background so it stays perfectly legible.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  // Plain style object, never a function — see the note in TentzuButton.
  const [pressed, setPressed] = useState(false);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <TentzuBackground />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 12 }}
      >
        <MascotHero source={MASCOT} height={288} />

        <View style={{ alignItems: 'center', marginTop: 26 }}>
          <Text
            style={{
              fontFamily: tentzuFont.headline,
              fontSize: 28,
              lineHeight: 34,
              letterSpacing: -0.6,
              color: tentzu.ink,
              textAlign: 'center',
            }}
          >
            Meet Tentzu, your{'\n'}
            <Text style={{ fontFamily: tentzuFont.headlineItalic, color: tentzu.primary }}>
              rental companion
            </Text>
            .
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
            }}
          >
            Tentzu remembers every rent cheque — the date and the amount — and keeps your
            documents safe. Let's set yours up in under a minute.
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' }}>
            <Feature icon="calendar-outline" label="Never miss a date" />
            <Feature icon="shield-checkmark-outline" label="Documents, safe" />
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: insets.bottom + 12 }}>
        <Pressable
          onPress={() => router.push('/(onboarding)/home')}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          style={{
            backgroundColor: tentzu.primary,
            borderRadius: 18,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: tentzu.primary,
            shadowOpacity: 0.28,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          <Text style={{ fontFamily: tentzuFont.headlineBold, fontSize: 18, color: '#ffffff' }}>
            Get started
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/email')}
          style={{ paddingVertical: 14, alignItems: 'center' }}
          hitSlop={6}
        >
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 14, color: tentzu.inkVariant }}>
            I already have an account{'  '}
            <Text style={{ fontFamily: tentzuFont.label, color: tentzu.primary }}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Feature({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        gap: 9,
        shadowColor: tentzu.primary,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <View style={{ backgroundColor: tentzu.tintSurface, padding: 10, borderRadius: 12 }}>
        <Ionicons name={icon} size={20} color={tentzu.primary} />
      </View>
      <Text style={{ fontFamily: tentzuFont.label, fontSize: 12.5, color: tentzu.ink }}>{label}</Text>
    </View>
  );
}
