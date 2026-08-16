import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ReminderLog } from '@/lib/types';
import { unwrapList, type Paginated } from './_paginated';

const FEED_KEY = ['notifications'] as const;
const UNREAD_KEY = ['notifications', 'unread'] as const;

/** The in-app notification feed — what the bell opens. */
export function useNotifications() {
  return useQuery({
    queryKey: FEED_KEY,
    queryFn: async () => {
      const { data } = await api.get<ReminderLog[] | Paginated<ReminderLog>>(
        '/reminders/notifications/',
      );
      return unwrapList<ReminderLog>(data);
    },
  });
}

/**
 * The badge number.
 *
 * Polled on an interval as well as refetched on focus: a reminder can land
 * while the app is open and sitting on the dashboard, and a bell that only
 * updates on navigation would show a stale count for as long as the user
 * stays put.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ unread: number }>('/reminders/notifications/unread-count/');
      return data.unread;
    },
    refetchInterval: 60_000,
    // A failed count must not render as "0 unread" — that silently hides real
    // notifications. Keep the last known value instead.
    placeholderData: (prev) => prev,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reminders/notifications/${id}/read/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ marked_read: number }>(
        '/reminders/notifications/read-all/',
      );
      return data.marked_read;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}
