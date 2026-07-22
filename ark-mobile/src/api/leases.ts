import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lease } from '@/lib/types';
import { unwrapList, type Paginated } from './_paginated';

const KEY = ['lease', 'current'] as const;

/**
 * Current user's lease (one per user in practice). Returns the first
 * lease the list endpoint yields, or null if none has been created yet.
 */
export function useLease() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Lease[] | Paginated<Lease>>('/leases/');
      const list = unwrapList<Lease>(data);
      return list[0] ?? null;
    },
  });
}
