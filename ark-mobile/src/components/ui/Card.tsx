import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { cn } from '@/lib/cn';

type CardProps = ViewProps & {
  className?: string;
  /** Opt out of the frosted treatment for dense/scrolling lists. */
  solid?: boolean;
};

/**
 * Frosted surface primitive.
 *
 * Was a flat white card; now a glass pane so the dashboard, documents and
 * settings share the same material as onboarding. Three layers: blur behind,
 * white fill for contrast, hairline light border for the edge.
 *
 * The white fill is deliberately doing the contrast work — text legibility must
 * not depend on the blur landing. Android gets a higher fill and lower blur
 * intensity because BlurView is more expensive there, and a flat-but-smooth
 * pane beats a faithful-but-janky one in a scrolling list.
 */
export function Card({ className, solid = false, children, ...props }: CardProps) {
  const fill = Platform.OS === 'android' ? 0.8 : 0.62;

  return (
    <View
      className={cn('rounded-card overflow-hidden p-5', className)}
      style={{
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: 'rgba(255,255,255,0.68)',
        shadowColor: '#0b3b45',
        shadowOpacity: 0.09,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      }}
      {...props}
    >
      {solid ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff' }]}
          pointerEvents="none"
        />
      ) : (
        <>
          <BlurView
            intensity={Platform.OS === 'android' ? 26 : 42}
            tint="light"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${fill})` }]}
            pointerEvents="none"
          />
        </>
      )}
      {children}
    </View>
  );
}
