import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatMoney, formatDate } from '@/lib/format';
import type { PaymentSchedule } from '@/lib/types';

type PaymentCardProps = {
  payment: PaymentSchedule;
  onMarkPaid?: (id: number) => void;
  marking?: boolean;
};

/** Compact row card showing one cheque in the schedule list. */
export function PaymentCard({ payment, onMarkPaid, marking }: PaymentCardProps) {
  const canPay = !!onMarkPaid && payment.status !== 'completed';
  return (
    <Card className="py-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-muted">Cheque {payment.cheque_number}</Text>
          <Text className="text-base font-semibold text-ink mt-0.5">
            {formatMoney(payment.amount, payment.currency)}
          </Text>
          <Text className="text-xs text-muted mt-0.5">{formatDate(payment.due_date)}</Text>
        </View>
        <StatusBadge status={payment.status} />
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
