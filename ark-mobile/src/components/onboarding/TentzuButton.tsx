import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Primary = cyan→blue gradient pill with a coloured glow, per the reference
 * flow. A flat fill reads as a painted rectangle next to frosted glass; the
 * ramp plus a same-hue shadow makes it read as lit.
 *
 * Ghost = translucent white pane with a hairline stroke, so secondary actions
 * belong to the same material family as the cards around them.
 *
 * NOTE: styles are plain objects, never the function form. Function-form style
 * props are dropped wholesale in Release builds — see the git history for the
 * bug where this button rendered with no background at all on device.
 */
export function TentzuButton({ label, onPress, loading, disabled, variant = 'primary', icon }: Props) {
  const isPrimary = variant === 'primary';
  const blocked = disabled || loading;
  const [pressed, setPressed] = useState(false);

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 17,
      }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : tentzu.primary} />
      ) : (
        <>
          <Text
            style={{
              fontFamily: tentzuFont.headlineBold,
              fontSize: 17,
              color: isPrimary ? '#ffffff' : tentzu.ink,
            }}
          >
            {label}
          </Text>
          {icon ? (
            <Ionicons name={icon} size={19} color={isPrimary ? '#ffffff' : tentzu.ink} />
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        opacity: blocked ? 0.45 : 1,
        transform: [{ scale: pressed && !blocked ? 0.985 : 1 }],
        // Glow is the brand hue, not black — a neutral shadow under a cyan pill
        // looks like dirt; a same-hue one looks like emitted light.
        shadowColor: isPrimary ? '#0e9ec4' : '#0b3b45',
        shadowOpacity: isPrimary ? 0.38 : 0.08,
        shadowRadius: isPrimary ? 18 : 10,
        shadowOffset: { width: 0, height: isPrimary ? 10 : 4 },
        elevation: isPrimary ? 6 : 2,
        borderWidth: isPrimary ? 0 : 1.5,
        borderColor: tentzu.glassStroke,
        backgroundColor: isPrimary ? 'transparent' : 'rgba(255,255,255,0.62)',
      }}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#22D3E8', '#12A9D6', '#1D7FD1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28 }}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}
