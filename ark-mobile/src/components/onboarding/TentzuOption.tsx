import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

// Selectable card. Turquoise fill + border + check bubble when selected.
export function TentzuOption({ title, subtitle, selected, onPress, icon }: Props) {
  // Plain style object, never a function — see the note in TentzuButton.
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: selected ? tentzu.primaryBright : 'rgba(255,255,255,0.55)',
        paddingVertical: 16,
        paddingHorizontal: 16,
        transform: [{ scale: pressed ? 0.99 : 1 }],
        shadowColor: selected ? tentzu.primary : '#0b3b45',
        shadowOpacity: selected ? 0.22 : 0.07,
        shadowRadius: selected ? 16 : 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: selected ? 4 : 1,
      }}
    >
      {/* Frosted pane behind the row. Selected state deepens the tint rather
          than swapping to a solid fill, so the material stays consistent. */}
      <BlurView
        intensity={Platform.OS === 'android' ? 24 : 38}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: selected
              ? 'rgba(214,246,248,0.80)'
              : `rgba(255,255,255,${Platform.OS === 'android' ? 0.76 : 0.58})`,
          },
        ]}
        pointerEvents="none"
      />
      {icon ? (
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? tentzu.primary : tentzu.tintSurface,
          }}
        >
          <Ionicons name={icon} size={21} color={selected ? '#ffffff' : tentzu.primary} />
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: tentzuFont.label, fontSize: 16, color: tentzu.ink }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? tentzu.primary : 'transparent',
          borderWidth: selected ? 0 : 1.5,
          borderColor: tentzu.fieldBorder,
        }}
      >
        {selected ? <Ionicons name="checkmark" size={15} color="#ffffff" /> : null}
      </View>
    </Pressable>
  );
}
