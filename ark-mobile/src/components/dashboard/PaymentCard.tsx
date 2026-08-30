import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatMoney, formatDate } from '@/lib/format';
import { deriveDisplayStatus } from '@/lib/paymentStatus';
import type { PaymentSchedule } from '@/lib/types';

type PaymentCardProps = {
  payment: PaymentSchedule;
  onMarkPaid?: (id: number) => void;
  marking?: boolean;
};

/** Compact row card showing one cheque in the schedule list. */
export function PaymentCard({ payment, onMarkPaid, marking }: PaymentCardProps) {
  const canPay = !!onMarkPaid && payment.status !== 'completed';
  const display = deriveDisplayStatus(payment);
  return (
    <Card className="py-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-muted">Cheque {payment.cheque_number}</Text>
          <Text className="text-base font-semibold text-ink mt-0.5">
            {formatMoney(payment.amount, payment.currency)}
          </Text>
          <Text
            className={cn(
              'text-xs mt-0.5',
              display === 'overdue' ? 'text-danger font-semibold' : 'text-muted',
            )}
          >
            {display === 'overdue' ? `Was due ${formatDate(payment.due_date)}` : formatDate(payment.due_date)}
          </Text>
        </View>
        <StatusBadge payment={payment} />
      </View>
      {canPay ? (
        <Pressable
          onPress={() => onMarkPaid!(payment.id)}
          disabled={marking}
          hitSlop={6}
          className="mt-3 self-end"
          accessibilityRole="button"
          accessibilityLabel={`Mark cheque ${payment.cheque_number} as paid`}
        >
          <Text className="text-sm font-semibold text-brand">Mark as paid</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
