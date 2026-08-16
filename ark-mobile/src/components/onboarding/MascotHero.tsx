import { Image } from 'expo-image';
import { View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  height?: number;
};

/**
 * The mascot, shown whole.
 *
 * Was a fixed-height panel with `resizeMode="cover"`, which cropped the artwork
 * to the head — the character's tie, cheque, watch and tail were all cut off.
 * Now `contentFit="contain"` so the entire figure is visible at every size.
 *
 * The bordered, tinted panel is gone too: in the designer's comps the mascot
 * floats directly on the backdrop rather than sitting inside a card, which is
 * what lets content overlap it and gives the screens their depth.
 */
export function MascotHero({ source, height = 300 }: Props) {
  return (
    <View style={{ height, alignSelf: 'stretch', alignItems: 'center' }}>
      <Image
        source={source}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
        cachePolicy="memory-disk"
        transition={0}
      />
    </View>
  );
}
