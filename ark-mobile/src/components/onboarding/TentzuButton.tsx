import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
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

// Primary = solid turquoise pill with a soft "cloud shadow" (per TENTZU brand).
// Ghost = quiet outlined button for secondary actions.
export function TentzuButton({ label, onPress, loading, disabled, variant = 'primary', icon }: Props) {
  const isPrimary = variant === 'primary';
  const blocked = disabled || loading;
  // Plain style object, never a function. NativeWind's cssInterop (jsxImportSource
  // is set to "nativewind") intercepts `style`, and a function form can be dropped
  // wholesale — taking the background, padding AND flexDirection with it.
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
      style={{
        backgroundColor: isPrimary ? tentzu.primary : 'transparent',
        borderWidth: isPrimary ? 0 : 1.5,
        borderColor: tentzu.fieldBorder,
        borderRadius: 18,
        paddingVertical: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: blocked ? 0.45 : 1,
        transform: [{ scale: pressed && !blocked ? 0.98 : 1 }],
        shadowColor: tentzu.primary,
        shadowOpacity: isPrimary ? 0.28 : 0,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: isPrimary ? 4 : 0,
      }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : tentzu.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
        </View>
      )}
    </Pressable>
  );
}
