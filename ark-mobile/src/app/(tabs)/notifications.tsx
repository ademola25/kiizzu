import { useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReminders } from '@/api/reminders';
import { ReminderRow } from '@/components/notifications/ReminderRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StateCard } from '@/components/ui/StateCard';
import { formatDayKey, localDayKey } from '@/lib/format';
import type { ReminderLog } from '@/lib/types';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const reminders = useReminders();

  const groups = useMemo(() => groupByDay(reminders.data ?? []), [reminders.data]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 108,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={reminders.isRefetching}
          onRefresh={() => reminders.refetch()}
        />
      }
    >
      <ScreenHeader
        title="Notifications"
        subtitle="A record of every reminder we've sent."
      />

      {reminders.isLoading ? (
        <StateCard variant="loading" />
      ) : reminders.isError ? (
        <StateCard
          variant="error"
          title="Couldn't load history"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => reminders.refetch()}
        />
      ) : groups.length === 0 ? (
        <StateCard
          variant="empty"
          title="No notifications yet"
          message="When we send you a reminder, it'll show up here."
        />
      ) : (
        groups.map((group) => (
          <View key={group.dayKey} className="gap-2.5">
            <Text className="text-xs uppercase tracking-widest text-muted">
              {formatDayKey(group.dayKey)}
            </Text>
            {group.items.map((log) => (
              <ReminderRow key={log.id} log={log} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

type DayGroup = { dayKey: string; items: ReminderLog[] };

/**
 * Buckets logs by local calendar day. Order of returned groups follows
 * first-seen insertion in the input — which is the backend's newest-first
 * ordering today — but the helper itself is order-tolerant if that ever
 * changes (a single log out of order still lands in the right bucket).
 */
function groupByDay(logs: ReminderLog[]): DayGroup[] {
  const map = new Map<string, ReminderLog[]>();
  for (const log of logs) {
    const key = localDayKey(log.sent_at);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(log);
    } else {
      map.set(key, [log]);
    }
  }
  return Array.from(map, ([dayKey, items]) => ({ dayKey, items }));
}
