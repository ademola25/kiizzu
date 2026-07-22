import { Text, View } from 'react-native';
import type { PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

type StatusBadgeProps = {
  status: PaymentStatus;
  className?: string;
};

const LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  ready: 'Ready',
  completed: 'Cleared',
};

/**
 * Small pill showing payment lifecycle state. Stays monochrome to match
 * Cal AI; "ready" is the only colored state (ink fill).
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <View
      className={cn(
        'rounded-pill px-2.5 py-1 self-start',
        status === 'completed' && 'bg-mist',
        status === 'ready' && 'bg-ink',
        status === 'pending' && 'border border-line bg-paper',
        className,
      )}
    >
      <Text
        className={cn(
          'text-xs font-semibold',
          status === 'completed' && 'text-muted',
          status === 'ready' && 'text-paper',
          status === 'pending' && 'text-ink',
        )}
      >
        {LABEL[status]}
      </Text>
    </View>
  );
}
