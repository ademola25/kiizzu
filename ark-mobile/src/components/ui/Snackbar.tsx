import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  /** Rendered when set; pass null to dismiss. */
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  /** Milliseconds before auto-dismiss. */
  duration?: number;
};

/**
 * Brief confirmation with one optional action.
 *
 * An Alert would block the screen to say something the user already knows,
 * which is why marking a cheque paid had no confirmation at all. This says what
 * happened and offers the way back without interrupting anything.
 *
 * The default duration is deliberately long: the whole point is to be reachable
 * by someone who has just realised they tapped the wrong row, and the standard
 * ~3s is not enough time to notice, read, and reach.
 */
export function Snackbar({ message, actionLabel, onAction, onDismiss, duration = 7000 }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 9 }).start();
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
    // onDismiss is re-created each render by callers; keying the timer on the
    // message alone keeps a re-render from cancelling and restarting it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration]);

  useEffect(() => {
    if (!message) slide.setValue(0);
  }, [message, slide]);

  if (!message) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 78, // clears the tab bar
        opacity: slide,
        transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: tentzu.ink,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          shadowColor: '#0b3b45',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <Text
          style={{ flex: 1, fontFamily: tentzuFont.body, fontSize: fontSize.label, color: tentzu.white }}
          numberOfLines={2}
        >
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text
              style={{
                fontFamily: tentzuFont.label,
                fontSize: fontSize.label,
                color: tentzu.primary,
                letterSpacing: 0.2,
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
