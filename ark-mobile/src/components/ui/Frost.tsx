import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

type Props = {
  /** iOS blur strength. Ignored on Android — see below. */
  intensity?: number;
  /** White fill over the blur. Carries the contrast on both platforms. */
  fill?: number;
};

/**
 * The frosted layer behind every glass surface.
 *
 * ANDROID USES NO BLUR AT ALL, deliberately.
 *
 * expo-blur's Android implementation painted an opaque white rectangle that
 * ignored the parent's rounded clip — visible as a hard white box sitting
 * behind the text inside input fields and stat pills. It looked like a
 * rendering fault, because it was one.
 *
 * The honest fix is to stop pretending: on Android this is a translucent white
 * fill and nothing else. We were already pushing the fill to ~0.78 there for
 * scroll performance, so the blur was contributing almost nothing visually
 * while causing a visible defect and costing frames. iOS keeps the real blur,
 * where it is cheap and correct.
 *
 * Single component so this decision lives in ONE place — it was previously
 * duplicated across seven files, which is how the artifact reached production
 * on every surface at once.
 */
export function Frost({ intensity = 38, fill }: Props) {
  const isAndroid = Platform.OS === 'android';
  const opacity = fill ?? (isAndroid ? 0.82 : 0.6);

  return (
    <>
      {isAndroid ? null : (
        <BlurView
          intensity={intensity}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${opacity})` }]}
        pointerEvents="none"
      />
    </>
  );
}
