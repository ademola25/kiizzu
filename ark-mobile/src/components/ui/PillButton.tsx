import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';

type PillButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  className?: string;
};

/** Full-width black pill button (Cal AI "Continue" style). */
export function PillButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: PillButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        'h-14 rounded-pill items-center justify-center px-6',
        isPrimary ? 'bg-brand' : 'bg-paper border border-line',
        (disabled || loading) && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#006a6a'} />
      ) : (
        <Text className={cn('text-base font-semibold', isPrimary ? 'text-paper' : 'text-ink')}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
