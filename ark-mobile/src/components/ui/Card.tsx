import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { Frost } from '@/components/ui/Frost';
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
 * The white fill does the contrast work — legibility must not depend on the
 * blur landing. Android gets no blur at all; see components/ui/Frost.tsx.
 */
export function Card({ className, solid = false, children, ...props }: CardProps) {
  const fill = Platform.OS === 'android' ? 0.8 : 0.62;

  return (
    <View
      className={cn('rounded-card overflow-hidden p-5', className)}
      style={{
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: 'rgba(255,255,255,0.55)',
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
        <Frost />
        </>
      )}
      {children}
    </View>
  );
}
