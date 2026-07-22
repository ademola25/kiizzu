import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaymentSchedule } from '@/lib/types';
import { unwrapList, type Paginated } from './_paginated';

const KEY = ['payment-schedules'] as const;

/** All payment schedules for the current user, ordered by due_date. */
export function usePayments() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<PaymentSchedule[] | Paginated<PaymentSchedule>>(
        '/payment-schedules/',
      );
      return unwrapList<PaymentSchedule>(data);
    },
  });
}

/**
 * Mark a single payment as "funds ready". Invalidates the list on success.
 * The backend ignores the request body for this transition; we send none.
 */
export function useMarkReady() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<PaymentSchedule>(
        `/payment-schedules/${id}/mark-ready/`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
