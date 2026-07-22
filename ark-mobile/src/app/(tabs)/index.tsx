import { useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountdownHero } from '@/components/dashboard/CountdownHero';
import { PaymentCard } from '@/components/dashboard/PaymentCard';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StateCard } from '@/components/ui/StateCard';
import { useMarkReady, usePayments } from '@/api/payments';
import { useAuth } from '@/store/auth';
import { errorMessage } from '@/lib/errors';
import { formatAED } from '@/lib/format';
import type { PaymentSchedule } from '@/lib/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const payments = usePayments();
  const markReady = useMarkReady();

  const view = useMemo(() => computeDashboardView(payments.data ?? []), [payments.data]);

  const handleMarkReady = (id: number) => {
    if (markReady.isPending) return; // guard against fast double-taps
    markReady.mutate(id, {
      onError: (error: unknown) => {
        Alert.alert(
          'Something went wrong',
          errorMessage(error, "Couldn't mark this cheque as ready. Try again."),
        );
      },
    });
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <ScrollView
      className="flex-1 bg-mist"
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={payments.isRefetching}
          onRefresh={() => payments.refetch()}
        />
      }
    >
      <ScreenHeader
        title={firstName ? `Hi, ${firstName}` : 'Ark'}
        subtitle="Your cheque schedule"
      />

      <CountdownHero
        payment={view.next}
        onMarkReady={handleMarkReady}
        marking={markReady.isPending}
      />

      {view.total > 0 ? (
        <View className="flex-row gap-3">
          <Stat label="Cleared" value={`${view.cleared}/${view.total}`} />
          <Stat label="Remaining" value={formatAED(view.remainingAmount)} />
        </View>
      ) : null}

      {payments.isLoading ? (
        <StateCard variant="loading" />
      ) : payments.isError ? (
        <StateCard
          variant="error"
          title="Couldn't load schedule"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => payments.refetch()}
        />
      ) : view.total === 0 ? (
        <StateCard
          variant="empty"
          title="No schedule yet"
          message="Once your lease is set up, your cheques will show here."
        />
      ) : (
        <>
          <Text className="text-lg font-semibold text-ink mt-1">Schedule</Text>
          <View className="gap-2.5">
            {view.rest.map((p) => (
              <PaymentCard key={p.id} payment={p} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

type DashboardView = {
  next: PaymentSchedule | null;
  rest: PaymentSchedule[];
  cleared: number;
  total: number;
  remainingAmount: number;
};

// Picks the cheque the user actually cares about right now:
//   - earliest non-completed with due_date >= today, otherwise
//   - earliest non-completed (handles a stale row the auto-complete missed).
// Everything else (including completed history) renders in the list below.
function computeDashboardView(list: PaymentSchedule[]): DashboardView {
  const sorted = [...list].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const today = new Date().toISOString().slice(0, 10);

  const candidates = sorted.filter((p) => p.status !== 'completed');
  const future = candidates.filter((p) => p.due_date >= today);
  const next = future[0] ?? candidates[0] ?? null;

  const rest = sorted.filter((p) => p !== next);
  const cleared = list.filter((p) => p.status === 'completed').length;
  const remainingAmount = list
    .filter((p) => p.status !== 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return { next, rest, cleared, total: list.length, remainingAmount };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 py-4 items-center">
      <Text className="text-lg font-bold text-ink" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-xs text-muted mt-1">{label}</Text>
    </Card>
  );
}
