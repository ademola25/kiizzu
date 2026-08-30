import { Text, View } from 'react-native';
import type { PaymentSchedule } from '@/lib/types';
import { deriveDisplayStatus, statusLabel } from '@/lib/paymentStatus';
import { cn } from '@/lib/cn';

type StatusBadgeProps = {
  payment: PaymentSchedule;
  className?: string;
};

/**
 * Payment state, as the tenant reads it: Paid / Due today / Overdue / Upcoming,
 * with "Funds ready" standing in for Upcoming once money has been set aside.
 *
 * Previously this showed the raw stored status — Pending / Ready / Cleared —
 * which never said a cheque was late. Overdue is the one state worth colour:
 * it is the only one that needs the tenant to do something today.
 */
export function StatusBadge({ payment, className }: StatusBadgeProps) {
  const display = deriveDisplayStatus(payment);
  const ready = display === 'upcoming' && payment.status === 'ready';

  return (
    <View
      className={cn(
        'rounded-pill px-2.5 py-1 self-start',
        display === 'paid' && 'bg-wash',
        display === 'overdue' && 'bg-danger',
        display === 'due_today' && 'bg-amber',
        display === 'upcoming' && (ready ? 'bg-brand' : 'border border-line bg-paper'),
        className,
      )}
    >
      <Text
        className={cn(
          'text-xs font-semibold',
          display === 'paid' && 'text-brand',
          display === 'overdue' && 'text-paper',
          display === 'due_today' && 'text-ink',
          display === 'upcoming' && (ready ? 'text-paper' : 'text-muted'),
        )}
      >
        {statusLabel(payment)}
      </Text>
    </View>
  );
}
