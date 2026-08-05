import { Image, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { tentzu } from '@/theme/tokens';

type Props = {
  source: ImageSourcePropType;
  height?: number;
};

/**
 * A contained, rounded mascot hero. The mascot lives inside its own bounded,
 * shadowed panel at the top of a screen — never behind the content — so the
 * copy below stays perfectly legible on a clean background.
 */
export function MascotHero({ source, height = 250 }: Props) {
  return (
    <View
      style={{
        height,
        alignSelf: 'stretch', // fill width even inside a centered illustration slot
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: tentzu.tintSurface,
        borderWidth: 1,
        borderColor: 'rgba(0,106,106,0.12)',
        shadowColor: tentzu.primary,
        shadowOpacity: 0.16,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 4,
      }}
    >
      <Image source={source} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
