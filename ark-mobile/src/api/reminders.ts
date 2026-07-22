import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReminderLog } from '@/lib/types';
import { unwrapList, type Paginated } from './_paginated';

const KEY = ['reminders'] as const;

/** Notification history for the current user (newest first per backend ordering). */
export function useReminders() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<ReminderLog[] | Paginated<ReminderLog>>('/reminders/');
      return unwrapList<ReminderLog>(data);
    },
  });
}
