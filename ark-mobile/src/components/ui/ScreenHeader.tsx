import { Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

/** Large left-aligned screen title, Cal AI style. */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="mb-5">
      <Text className="text-3xl font-bold text-ink tracking-tight">{title}</Text>
      {subtitle ? <Text className="text-base text-muted mt-1">{subtitle}</Text> : null}
    </View>
  );
}
