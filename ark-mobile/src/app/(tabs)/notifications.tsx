import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMarkAllRead, useMarkRead, useNotifications } from '@/api/notifications';
import { NotificationRow } from '@/components/notifications/NotificationRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StateCard } from '@/components/ui/StateCard';
import { formatDayKey, localDayKey } from '@/lib/format';
import type { ReminderLog } from '@/lib/types';
import { tentzu, tentzuFont } from '@/theme/tokens';

/**
 * The in-app notification feed — what the bell opens.
 *
 * Shows only in-app notifications, not the whole delivery log. A failed SMS row
 * here would read as a message the tenant never got, on a channel they may not
 * even have switched on.
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const notifications = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = notifications.data ?? [];
  const groups = useMemo(() => groupByDay(items), [items]);
  const unreadCount = items.filter((n) => !n.is_read).length;

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
          refreshing={notifications.isRefetching}
          onRefresh={() => notifications.refetch()}
        />
      }
    >
      <ScreenHeader
        title="Notifications"
        subtitle="Everything I've flagged for you."
      />

      {unreadCount > 0 ? (
        <Pressable
          onPress={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel={`Mark all ${unreadCount} as read`}
          style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
        >
          <Text style={{ fontFamily: tentzuFont.label, fontSize: 13, color: tentzu.primary }}>
            Mark all as read ({unreadCount})
          </Text>
        </Pressable>
      ) : null}

      {notifications.isLoading ? (
        <StateCard variant="loading" />
      ) : notifications.isError ? (
        <StateCard
          variant="error"
          title="Couldn't load notifications"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => notifications.refetch()}
        />
      ) : groups.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nothing to read yet"
          message="When a payment is coming up, I'll put the reminder here."
        />
      ) : (
        groups.map((group) => (
          <View key={group.dayKey} className="gap-2.5">
            <Text className="text-xs uppercase tracking-widest text-muted">
              {formatDayKey(group.dayKey)}
            </Text>
            {group.items.map((log) => (
              <NotificationRow
                key={log.id}
                log={log}
                // Reading is the act of opening it. Marking read only on an
                // explicit button would leave the badge lit over notifications
                // the tenant has plainly already seen.
                onPress={() => {
                  if (!log.is_read) markRead.mutate(log.id);
                }}
              />
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
