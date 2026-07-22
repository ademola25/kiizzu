import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from './Card';
import { PillButton } from './PillButton';
import { colors } from '@/theme/tokens';

type Variant = 'loading' | 'error' | 'empty';

type StateCardProps = {
  variant: Variant;
  title?: string;
  message?: string;
  /** Optional CTA — typically "Retry" on error, but free-form. */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Single primitive for the loading / error / empty triad we used to write
 * by hand on every screen. Keeps copy + spacing consistent across the app.
 */
export function StateCard({
  variant,
  title,
  message,
  actionLabel,
  onAction,
}: StateCardProps) {
  if (variant === 'loading') {
    // Default the caption so a bare <StateCard variant="loading" /> doesn't
    // render a lonely spinner — it should always say *something* while the
    // user waits.
    const caption = message ?? 'Loading…';
    return (
      <Card className="py-8 items-center">
        <ActivityIndicator color={colors.ink} />
        <Text className="text-sm text-muted mt-3">{caption}</Text>
      </Card>
    );
  }

  return (
    <Card className="py-6 items-center">
      {title ? (
        <Text className="text-base font-semibold text-ink text-center">{title}</Text>
      ) : null}
      {message ? (
        <Text className="text-sm text-muted mt-1 text-center px-4">{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-4 w-full">
          <PillButton label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}
