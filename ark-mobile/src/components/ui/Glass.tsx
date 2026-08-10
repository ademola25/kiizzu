import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: ReactNode;
  /** Corner radius. Cards ~22, fields ~16, pills use the height. */
  radius?: number;
  /** How much of the backdrop shows through. Higher = more frosted. */
  intensity?: number;
  /** Extra white fill on top of the blur — raises contrast for dense content. */
  tint?: number;
  style?: ViewStyle;
  /** Turn off the top specular highlight (e.g. for small controls). */
  sheen?: boolean;
};

/**
 * Frosted-glass surface — the app's core material.
 *
 * Three layers, which is what separates real glass from "a translucent box":
 *   1. BlurView       — refracts the backdrop behind it
 *   2. white fill     — guarantees text contrast no matter what is behind
 *   3. specular edge  — a hairline top highlight + border, so the pane has an
 *                       edge and reads as a physical object rather than a hole
 *
 * On Android, BlurView is more expensive and historically less faithful, so the
 * white fill is raised there and the blur intensity lowered: better a slightly
 * flatter pane than a janky scroll. Content legibility never depends on the
 * blur landing — that is a deliberate constraint, not a fallback.
 */
export function Glass({
  children,
  radius = 22,
  intensity = 40,
  tint = 0.55,
  style,
  sheen = true,
}: Props) {
  const isAndroid = Platform.OS === 'android';
  const blurIntensity = isAndroid ? Math.min(intensity, 28) : intensity;
  const fill = isAndroid ? Math.min(tint + 0.18, 0.9) : tint;

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: 'rgba(255,255,255,0.65)',
          // Soft ambient shadow — glass floats, it does not sit flush.
          shadowColor: '#0b3b45',
          shadowOpacity: 0.10,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        },
        style,
      ]}
    >
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${fill})` }]}
        pointerEvents="none"
      />
      {sheen ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
          locations={[0, 0.55]}
          style={[StyleSheet.absoluteFill, { height: '55%' }]}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}
