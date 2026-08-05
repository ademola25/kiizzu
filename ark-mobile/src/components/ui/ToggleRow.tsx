import { Switch, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

/**
 * Label + description on the left, native Switch on the right. The Switch
 * is RN's platform-native primitive — looks at home on both iOS and Android,
 * tinted to our brand (ink track when on, mist when off).
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: ToggleRowProps) {
  // RN's Switch on Android doesn't visibly dim when disabled. Dropping
  // opacity on the whole row gives a consistent affordance on both platforms.
  return (
    <View
      className="flex-row items-center justify-between py-1"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-ink">{label}</Text>
        {description ? (
          <Text className="text-sm text-muted mt-0.5">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.line, true: colors.brand }}
        thumbColor={colors.paper}
        ios_backgroundColor={colors.line}
      />
    </View>
  );
}
