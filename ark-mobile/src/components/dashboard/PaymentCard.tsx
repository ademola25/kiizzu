import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatAED, formatDate } from '@/lib/format';
import type { PaymentSchedule } from '@/lib/types';

type PaymentCardProps = {
  payment: PaymentSchedule;
};

/** Compact row card showing one cheque in the schedule list. */
export function PaymentCard({ payment }: PaymentCardProps) {
  return (
    <Card className="py-4 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-sm text-muted">Cheque {payment.cheque_number}</Text>
        <Text className="text-base font-semibold text-ink mt-0.5">
          {formatAED(payment.amount)}
        </Text>
        <Text className="text-xs text-muted mt-0.5">{formatDate(payment.due_date)}</Text>
      </View>
      <StatusBadge status={payment.status} />
    </Card>
  );
}
