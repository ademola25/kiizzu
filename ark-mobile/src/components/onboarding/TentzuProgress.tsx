import { View } from 'react-native';
import { tentzu } from '@/theme/tokens';

// Segmented progress: `total` little rounded bars, the first `step` filled teal.
export function TentzuProgress({ step, total }: { step: number; total: number }) {
  return (
    <View
      style={{ flexDirection: 'row', gap: 6, flex: 1 }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            backgroundColor: i < step ? tentzu.primary : tentzu.track,
          }}
        />
      ))}
    </View>
  );
}
