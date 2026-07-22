import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Step } from '@/components/ui/Step';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/store/auth';
import { useOnboarding } from '@/store/onboarding';

const PATTERN_LABEL: Record<number, string> = {
  1: 'Annual',
  2: 'Bi-annual',
  3: '3 cheques',
  4: 'Quarterly',
  6: 'Bi-monthly',
};

export default function ReviewStep() {
  const { draft } = useOnboarding();
  const refreshUser = useAuth((s) => s.refreshUser);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rent = Number(draft.rent_amount.replace(/,/g, ''));
  const perCheque = draft.cheque_pattern ? rent / draft.cheque_pattern : 0;

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/leases/create/', {
        building_name: draft.building_name.trim(),
        area: draft.area.trim(),
        unit_number: draft.unit_number.trim(),
        address: draft.address.trim(),
        cheque_pattern: draft.cheque_pattern,
        start_date: draft.start_date,
        rent_amount: rent,
      });
      await refreshUser(); // flips onboarding_complete server-side → reflects locally
      router.replace('/(onboarding)/celebrate');
    } catch (e: unknown) {
      setError(errorMessage(e, 'Could not save lease. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Step
      step={6}
      total={6}
      title="Looks good?"
      subtitle="We'll generate your cheque schedule from this."
      continueLabel="Create my schedule"
      onContinue={submit}
      loading={loading}
    >
      <Card>
        <Row label="Building" value={draft.building_name} />
        <Row label="Area" value={draft.area} />
        <Row label="Unit" value={draft.unit_number} />
        <Row label="Address" value={draft.address} last />
      </Card>

      <Card className="mt-3">
        <Row
          label="Cheque pattern"
          value={draft.cheque_pattern ? PATTERN_LABEL[draft.cheque_pattern] : '—'}
        />
        <Row label="Start date" value={draft.start_date} />
        <Row label="Annual rent" value={`AED ${formatMoney(rent)}`} />
        <Row
          label="Per cheque"
          value={`AED ${formatMoney(perCheque)}`}
          last
        />
      </Card>

      {error ? <Text className="text-sm text-flame mt-3">{error}</Text> : null}
    </Step>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={`flex-row justify-between py-2 ${last ? '' : 'border-b border-line'}`}
    >
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-ink flex-1 text-right ml-3" numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-AE', { maximumFractionDigits: 0 });
}
