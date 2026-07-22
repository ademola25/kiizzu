import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';

type OptionCardProps = PressableProps & {
  label: string;
  description?: string;
  selected?: boolean;
  className?: string;
};

/** Selectable row card — black border + check when selected. Used in pattern step. */
export function OptionCard({
  label,
  description,
  selected = false,
  className,
  ...props
}: OptionCardProps) {
  return (
    <Pressable
      className={cn(
        'rounded-2xl bg-paper border px-4 py-4 flex-row items-center justify-between',
        selected ? 'border-ink' : 'border-line',
        className,
      )}
      {...props}
    >
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-ink">{label}</Text>
        {description ? (
          <Text className="text-sm text-muted mt-0.5">{description}</Text>
        ) : null}
      </View>
      <View
        className={cn(
          'w-6 h-6 rounded-full items-center justify-center',
          selected ? 'bg-ink' : 'border border-line',
        )}
      >
        {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}
