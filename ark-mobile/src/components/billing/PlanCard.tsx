import { Text, View } from 'react-native';
import { STARTER_PRICE_LABEL } from '@/api/billing';
import { Card } from '@/components/ui/Card';
import { PillButton } from '@/components/ui/PillButton';
import type { Tier } from '@/lib/types';

type PlanCardProps = {
  tier: Tier | undefined;
  loading?: boolean;
  onUpgrade: () => void;
};

const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  starter: 'Starter',
  // Pro is defined for type-exhaustiveness but the backend webhook never
  // upgrades anyone here today — surfacing this copy requires a Pro
  // checkout path that doesn't exist yet.
  pro: 'Pro',
};

const TIER_DESCRIPTION: Record<Tier, string> = {
  free: 'Email reminders for one property.',
  starter: 'Email + WhatsApp reminders.',
  // See note above — not yet purchasable.
  pro: 'Everything in Starter, with extras.',
};

/**
 * Plan summary for Settings. Shows the current tier; free users get an
 * upgrade CTA. We don't ship a manage/cancel button — the backend doesn't
 * expose a customer-portal endpoint yet.
 */
export function PlanCard({ tier, loading, onUpgrade }: PlanCardProps) {
  if (loading || !tier) {
    return (
      <Card>
        <Text className="text-xs uppercase tracking-widest text-muted">Plan</Text>
        <Text className="text-sm text-muted mt-2">Loading…</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text className="text-xs uppercase tracking-widest text-muted">Plan</Text>
      <View className="flex-row items-baseline mt-2 gap-2">
        <Text className="text-2xl font-bold text-ink">{TIER_LABEL[tier]}</Text>
        {tier === 'starter' ? (
          <Text className="text-sm text-muted">· {STARTER_PRICE_LABEL}</Text>
        ) : null}
      </View>
      <Text className="text-sm text-muted mt-1">{TIER_DESCRIPTION[tier]}</Text>

      {tier === 'free' ? (
        <View className="mt-4">
          <PillButton
            label={`Upgrade to Starter — ${STARTER_PRICE_LABEL}`}
            onPress={onUpgrade}
          />
        </View>
      ) : null}
    </Card>
  );
}
