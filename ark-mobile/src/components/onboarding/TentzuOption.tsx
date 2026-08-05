import { Pressable, Text, View } from 'react-native';
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: selected ? tentzu.tintSurface : tentzu.card,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: selected ? tentzu.primary : tentzu.fieldBorder,
        paddingVertical: 16,
        paddingHorizontal: 16,
        transform: [{ scale: pressed ? 0.99 : 1 }],
        shadowColor: tentzu.primary,
        shadowOpacity: selected ? 0.12 : 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: selected ? 2 : 1,
      })}
    >
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
