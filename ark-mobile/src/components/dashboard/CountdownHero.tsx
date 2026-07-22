import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PillButton } from '@/components/ui/PillButton';
import { cn } from '@/lib/cn';
import { daysUntil, formatAED, formatDate } from '@/lib/format';
import type { PaymentSchedule } from '@/lib/types';

type CountdownHeroProps = {
  payment: PaymentSchedule | null;
  onMarkReady?: (id: number) => void;
  marking?: boolean;
};

type Tone = 'calm' | 'urgent' | 'overdue';

type HeroCopy = {
  eyebrow: string;
  bigNumber: string;
  bigSuffix: string;
  tone: Tone;
  reassurance?: string;
};

/**
 * Top dashboard card. Big number = days until next pending/ready cheque.
 * Within 7 days we surface a "Mark funds ready" CTA + flame-border accent;
 * past-due reads as "overdue" with the same urgency tone; otherwise calm.
 */
export function CountdownHero({ payment, onMarkReady, marking }: CountdownHeroProps) {
  if (!payment) {
    return (
      <Card className="items-center py-10">
        <Text className="text-base text-muted">No upcoming cheques.</Text>
      </Card>
    );
  }

  const days = daysUntil(payment.due_date);
  const isReady = payment.status === 'ready';
  const copy = describeCountdown(days, isReady);
  const showCta = copy.tone !== 'calm' && !isReady && payment.status === 'pending' && onMarkReady;

  return (
    <Card className={cn(copy.tone !== 'calm' && 'border-flame')}>
      <View className="items-center py-4">
        <Text className="text-xs uppercase tracking-widest text-muted">{copy.eyebrow}</Text>
        <Text className="text-6xl font-bold text-ink mt-2">{copy.bigNumber}</Text>
        <Text className="text-sm text-muted mt-1">{copy.bigSuffix}</Text>

        <View className="h-px bg-line w-full my-5" />

        <Text className="text-2xl font-bold text-ink">{formatAED(payment.amount)}</Text>
        <Text className="text-sm text-muted mt-1">Due {formatDate(payment.due_date)}</Text>

        {isReady ? (
          <Text
            className="text-sm font-semibold text-ink mt-4"
            accessibilityLabel="Funds ready"
          >
            Funds ready ✓
          </Text>
        ) : copy.reassurance ? (
          <Text className="text-sm font-semibold text-ink mt-4">{copy.reassurance}</Text>
        ) : null}

        {showCta ? (
          <View className="w-full mt-5">
            <PillButton
              label="Mark funds ready"
              loading={marking}
              disabled={marking}
              onPress={() => onMarkReady!(payment.id)}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function describeCountdown(days: number, isReady: boolean): HeroCopy {
  if (days < 0) {
    const n = Math.abs(days);
    return {
      eyebrow: 'Cheque overdue',
      bigNumber: String(n),
      bigSuffix: n === 1 ? 'day overdue' : 'days overdue',
      tone: 'overdue',
    };
  }
  if (days === 0) {
    return {
      eyebrow: 'Cheque due',
      bigNumber: '0',
      bigSuffix: 'today',
      tone: 'urgent',
    };
  }
  if (days <= 7) {
    return {
      eyebrow: 'Next cheque in',
      bigNumber: String(days),
      bigSuffix: days === 1 ? 'day' : 'days',
      tone: 'urgent',
    };
  }
  return {
    eyebrow: 'Next cheque in',
    bigNumber: String(days),
    bigSuffix: 'days',
    tone: 'calm',
    reassurance: isReady ? undefined : "You're all set",
  };
}
