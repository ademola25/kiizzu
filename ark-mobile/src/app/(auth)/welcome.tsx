import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { kizu, kizuFont } from '@/theme/tokens';

const HERO = require('../../../assets/images/welcome-hero.png');

// Kizu welcome / landing — first screen the user sees (mirrors design-reference
// kizu/screen.png). "Get Started" leads into the existing auth flow.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: kizu.bg, paddingTop: insets.top }}>
      <StatusBar style="dark" />

      {/* Hero region — flexes to fill space above the content; the cropped
          composite (Dubai window + Teno on his moving box) keeps full aspect. */}
      <View style={{ flex: 1, minHeight: 240 }}>
        <Image
          source={HERO}
          resizeMode="contain"
          style={{ flex: 1, width: '100%' }}
        />
      </View>

      {/* Copy */}
      <View style={{ paddingHorizontal: 28, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: kizuFont.headline,
            fontSize: 27,
            lineHeight: 34,
            letterSpacing: -0.5,
            color: kizu.ink,
            textAlign: 'center',
          }}
        >
          Renting Shouldn't Be{' '}
          <Text style={{ fontFamily: kizuFont.headlineItalic, color: kizu.primary }}>
            Stressful
          </Text>
          .
        </Text>

        <Text
          style={{
            fontFamily: kizuFont.body,
            fontSize: 14,
            lineHeight: 21,
            color: kizu.inkVariant,
            textAlign: 'center',
            marginTop: 12,
            maxWidth: 300,
          }}
        >
          Track rent. Store documents. Never miss important tenancy dates.
        </Text>

        {/* Feature chips */}
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 24, width: '100%' }}>
          <FeatureCard
            icon="cash-outline"
            iconColor={kizu.primary}
            iconBg="rgba(0,106,106,0.10)"
            label="Rent Tracking"
          />
          <FeatureCard
            icon="document-text-outline"
            iconColor={kizu.secondary}
            iconBg="rgba(80,96,111,0.12)"
            label="Digital Vault"
          />
        </View>
      </View>

      {/* Bottom action bar */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 12 }}>
        <Pressable
          onPress={() => router.push('/(auth)/sign-in')}
          style={({ pressed }) => ({
            backgroundColor: kizu.primary,
            borderRadius: 18,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: kizu.primary,
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          })}
        >
          <Text style={{ fontFamily: kizuFont.headlineBold, fontSize: 18, color: '#ffffff' }}>
            Get Started
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>

        {/* Pagination dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 20,
          }}
        >
          <View style={{ width: 22, height: 6, borderRadius: 999, backgroundColor: kizu.primary }} />
          <Dot />
          <Dot />
          <Dot />
        </View>
      </View>
    </View>
  );
}

function FeatureCard({
  icon,
  iconColor,
  iconBg,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 10,
        shadowColor: '#006a6a',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <View style={{ backgroundColor: iconBg, padding: 10, borderRadius: 12 }}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={{ fontFamily: kizuFont.label, fontSize: 13, color: kizu.ink }}>{label}</Text>
    </View>
  );
}

function Dot() {
  return <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: kizu.outline }} />;
}
