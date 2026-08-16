import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { TentzuBackground } from './TentzuBackground';
import { mascotAssistant } from './mascots';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onDone: () => void;
  /** Total dwell, ms. The proposal specifies a 3-second beat. */
  duration?: number;
};

// Each line is something we genuinely do with the file, in order. Inventing
// steps we do not perform ("Extracting rent amount…") would be a lie the very
// next screen exposes when it asks for the rent.
const STAGES = [
  'Opening your lease…',
  'Checking the pages…',
  'Filing it in your vault…',
];

/**
 * The pause after a lease upload.
 *
 * A deliberate wait, which sounds wrong until you consider the alternative:
 * an instant transition reads as "nothing happened". Work that appears to take
 * no time appears not to have occurred, so the file would feel discarded.
 * Three seconds is long enough to register as effort, short enough not to annoy.
 */
export function OrganizingOverlay({ visible, onDone, duration = 3000 }: Props) {
  const [stage, setStage] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  // Callers pass an inline arrow, so `onDone` is a new function every render.
  // Depending on it directly would restart the timers on any parent re-render
  // and the overlay could never finish. Hold it in a ref and depend on nothing.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setStage(0);
      progress.setValue(0);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // animating width
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    const step = duration / STAGES.length;
    const timers = STAGES.map((_, i) => setTimeout(() => setStage(i), i * step));
    const finish = setTimeout(() => onDoneRef.current(), duration);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [visible, duration, progress, pulse]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['4%', '100%'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <TentzuBackground variant="cool" />

        <Animated.View style={{ transform: [{ scale }] }}>
          <Image
            source={mascotAssistant}
            style={{ width: 220, height: 260 }}
            contentFit="contain"
            transition={0}
          />
        </Animated.View>

        <Text
          style={{
            fontFamily: tentzuFont.headlineBold,
            fontSize: 24,
            lineHeight: 30,
            letterSpacing: -0.6,
            color: tentzu.ink,
            textAlign: 'center',
            marginTop: 18,
          }}
        >
          Tentzu is organizing{'\n'}your lease…
        </Text>

        <Text
          style={{
            fontFamily: tentzuFont.body,
            fontSize: 15,
            color: tentzu.mutedInk,
            textAlign: 'center',
            marginTop: 10,
            minHeight: 22,
          }}
        >
          {STAGES[stage]}
        </Text>

        <View
          style={{
            width: '100%',
            maxWidth: 280,
            height: 8,
            borderRadius: 999,
            backgroundColor: 'rgba(13,43,62,0.10)',
            overflow: 'hidden',
            marginTop: 22,
          }}
        >
          <Animated.View style={{ width, height: '100%' }}>
            <LinearGradient
              colors={['#22D3E8', '#7FE9F2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 999 }}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
