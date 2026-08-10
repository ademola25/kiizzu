import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { tentzu, tentzuFont } from '@/theme/tokens';
import { TentzuButton } from './TentzuButton';
import { TentzuBackground, type BackdropVariant } from './TentzuBackground';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  illustration?: ReactNode;
  step?: number;
  total?: number;
  showBack?: boolean;
  onBack?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryIcon?: keyof typeof Ionicons.glyphMap;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerNote?: ReactNode;
  /** Backdrop family — see design-reference/designer-kizu/SPEC.md §1. */
  backdrop?: BackdropVariant;
};

// The shared onboarding scaffold: calm-blue background, back + progress header,
// centered illustration, headline/subtitle, content, and a sticky action bar.
export function TentzuScreen({
  title,
  subtitle,
  children,
  illustration,
  step,
  total,
  showBack = true,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  primaryIcon,
  secondaryLabel,
  onSecondary,
  footerNote,
  backdrop = 'cool',
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    // KeyboardAwareScrollView (keyboard-controller) rather than the stock
    // KeyboardAvoidingView: from Android 15 the window no longer resizes for
    // adjustResize, and Expo's default edge-to-edge compounds it, so the stock
    // component did nothing on Android and the keyboard covered the field being
    // typed into. This one scrolls the focused input into view on both
    // platforms and needs no per-platform behavior prop.
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <TentzuBackground variant={backdrop} />

      {/* Header: back + progress */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: insets.top + 10,
          paddingHorizontal: 20,
          paddingBottom: 6,
        }}
      >
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 38, height: 38, marginLeft: -6, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={26} color={tentzu.ink} />
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
        <View style={{ flex: 1 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // Extra room so the focused field clears the keyboard *and* the sticky
        // action bar that sits below the scroll area.
        bottomOffset={96}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
      >
        {/* Wordmark, top-left, on every screen — SPEC §2. */}
        <Text
          style={{
            fontFamily: tentzuFont.headlineBold,
            fontSize: 26,
            letterSpacing: 1.5,
            color: tentzu.ink,
            marginBottom: step && total ? 14 : 18,
          }}
        >
          TENTZU
        </Text>

        {/* Step counter sits ABOVE the headline in the comps, small and cyan. */}
        {step && total ? (
          <Text
            style={{
              fontFamily: tentzuFont.label,
              fontSize: 14,
              color: tentzu.primaryBright,
              marginBottom: 6,
            }}
          >
            {step} of {total}
          </Text>
        ) : null}

        {/* Headline: large, bold, LEFT-aligned, two lines. The comps run
            34-40px; ours was 28 and centred, which read as a form label next to
            them. */}
        <Text
          style={{
            fontFamily: tentzuFont.headlineBold,
            fontSize: 34,
            lineHeight: 39,
            letterSpacing: -0.8,
            color: tentzu.ink,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: tentzuFont.body,
              fontSize: 16,
              lineHeight: 23,
              color: tentzu.mutedInk,
              marginTop: 10,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {/* Illustration now sits BELOW the headline — in the comps the mascot is
            the centrepiece of the content area, not a header banner. */}
        {illustration ? (
          <View style={{ alignItems: 'center', marginTop: 18 }}>{illustration}</View>
        ) : null}

        <View style={{ marginTop: 22 }}>{children}</View>
      </KeyboardAwareScrollView>

      {/* Sticky action bar — a glass shelf, so the CTA floats over the backdrop
          instead of sitting on an opaque strip that cuts the screen in half. */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 14,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderTopColor: 'rgba(255,255,255,0.7)',
          overflow: 'hidden',
        }}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 26 : 44}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(255,255,255,${Platform.OS === 'android' ? 0.72 : 0.5})` },
          ]}
          pointerEvents="none"
        />
        {/* Progress lives at the BOTTOM in the comps — a glowing gradient bar
            with an "n of m" label — not as segments in the header. */}
        {step && total ? (
          <View style={{ marginBottom: 14 }}>
            <View
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(13,43,62,0.10)',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#18D7E7', '#7FE9F2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: `${Math.round((step / total) * 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                }}
              />
            </View>
            <Text
              style={{
                fontFamily: tentzuFont.label,
                fontSize: 13,
                color: tentzu.mutedInk,
                textAlign: 'center',
                marginTop: 7,
              }}
            >
              {step} of {total}
            </Text>
          </View>
        ) : null}

        {footerNote ? <View style={{ marginBottom: 12 }}>{footerNote}</View> : null}
        <TentzuButton
          label={primaryLabel}
          onPress={onPrimary}
          disabled={primaryDisabled}
          loading={primaryLoading}
          icon={primaryIcon}
        />
        {secondaryLabel && onSecondary ? (
          <Pressable onPress={onSecondary} style={{ paddingVertical: 14, alignItems: 'center' }} hitSlop={6}>
            <Text style={{ fontFamily: tentzuFont.label, fontSize: 14, color: tentzu.primary }}>
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
