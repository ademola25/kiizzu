import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';

import { api } from '@/lib/api';
import type { Subscription, Tier } from '@/lib/types';
import { useAuth } from '@/store/auth';

export const subscriptionQueryKey = ['subscription'] as const;

/** Single source of truth for displayed Starter pricing — backend doesn't expose it. */
export const STARTER_PRICE_LABEL = 'AED 15 / month';

/** Current user's subscription. Gated to signed-in to avoid 401-noise on boot. */
export function useSubscription() {
  const signedIn = useAuth((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: subscriptionQueryKey,
    enabled: signedIn,
    queryFn: async () => {
      const { data } = await api.get<Subscription>('/billing/subscription/');
      return data;
    },
  });
}

export type CheckoutInput = {
  tier: Exclude<Tier, 'free'>; // can't "upgrade" to free
};

/**
 * Creates a Stripe checkout session. We register the *base* /billing-return
 * URL as the redirect with `openAuthSessionAsync`, then encode success vs
 * cancel intent in the `status` query param so the auth session can match
 * both routes on its prefix — otherwise cancellations hang the in-app
 * browser because the cancel URL wouldn't match the registered redirect.
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async ({ tier }: CheckoutInput) => {
      const returnUrl = Linking.createURL('/billing-return');
      const successUrl = Linking.createURL('/billing-return', {
        queryParams: { status: 'success' },
      });
      const cancelUrl = Linking.createURL('/billing-return', {
        queryParams: { status: 'cancel' },
      });

      const { data } = await api.post<{ checkout_url: string }>('/billing/checkout/', {
        tier,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return { checkoutUrl: data.checkout_url, returnUrl };
    },
  });
}

/** Drop the cached subscription so callers re-fetch fresh after a return. */
export function useInvalidateSubscription() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: subscriptionQueryKey });
}
