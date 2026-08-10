import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const BACKDROP = require('../../../assets/images/app-backdrop.jpg');

/**
 * Backdrop variants — the designer uses a DIFFERENT backdrop per screen family,
 * not one plate everywhere. See design-reference/designer-kizu/SPEC.md §1.
 *
 *   warm    cream→white       welcome, celebrate            (comps 06, 08)
 *   cool    pale blue→white   onboarding questions          (comps 05, 09, 14)
 *   deep    blue, richer edge dashboard / vault / services   (comps 10, 13, 03)
 *   photo   blurred interior  date pickers, sign-in          (comps 02, 16, 07)
 *
 * Gradients rather than images for everything except `photo`: the comps are
 * clean light gradients, and our single blurred photo read grey and muddy by
 * comparison. Gradients also cost nothing to decode and never band on scroll.
 */
export type BackdropVariant = 'warm' | 'cool' | 'deep' | 'photo';

const RAMPS: Record<Exclude<BackdropVariant, 'photo'>, [string, string, string]> = {
  // Cream at the top fading to white — the welcome comps are noticeably warmer
  // than the rest of the app, which makes the entry feel softer.
  warm: ['#FBF4EA', '#FAF7F3', '#F2F6F7'],
  cool: ['#F4FAFC', '#E9F4F9', '#DCEDF5'],
  deep: ['#EAF3F8', '#DDEBF4', '#CBE2EF'],
};

type Props = {
  variant?: BackdropVariant;
};

export function TentzuBackground({ variant = 'cool' }: Props) {
  if (variant === 'photo') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={BACKDROP}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
        {/* Heavy scrim: the comps' photo backdrops are almost washed out, with
            only enough detail left to read as a room. Without this the photo
            competes with the glass sitting on top of it. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.72)', 'rgba(240,248,251,0.58)', 'rgba(203,226,239,0.62)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  const ramp = RAMPS[variant];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={ramp}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft corner bloom — the comps have a light source rather than a flat
          wash, which is what stops a two-stop gradient looking like a CSS demo. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
