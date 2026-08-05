import { Text, View } from 'react-native';
import { tentzu, tentzuFont } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

/** Large left-aligned screen title — TENTZU display type. */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="mb-5">
      <Text style={{ fontFamily: tentzuFont.headline, fontSize: 28, letterSpacing: -0.5, color: tentzu.ink }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontFamily: tentzuFont.body, fontSize: 15, color: tentzu.mutedInk, marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
