import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { tentzu, tentzuFont } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Top-right slot — the notification bell on screens that carry one. */
  right?: ReactNode;
};

/** Large left-aligned screen title — TENTZU display type. */
export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View className="mb-5 flex-row items-start">
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: tentzuFont.headline, fontSize: 28, letterSpacing: -0.5, color: tentzu.ink }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 15, color: tentzu.mutedInk, marginTop: 4 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {/* Nudged up so the bell optically centres on the title rather than the
          title-plus-subtitle block. */}
      {right ? <View style={{ marginLeft: 12, marginTop: 2 }}>{right}</View> : null}
    </View>
  );
}
