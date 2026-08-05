import { router } from 'expo-router';

import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { composeAddress, useOnboarding } from '@/store/onboarding';

/**
 * Persists the collected lease (+ WhatsApp preference) for the now-authenticated,
 * email-verified user, then routes on. Shared by the account wall and the
 * email-verification screen so the "finish" logic lives in exactly one place.
 *
 * If the account is already onboarded (e.g. a returning user who logged in
 * during onboarding), it skips creating a duplicate lease and goes to the tabs.
 */
export async function finishOnboarding(): Promise<void> {
  const auth = useAuth.getState();
  await auth.refreshUser();
  if (useAuth.getState().user?.onboarding_complete) {
    router.replace('/(tabs)');
    return;
  }

  const draft = useOnboarding.getState().draft;
  await auth.updateProfile({ whatsapp_opted_in: draft.whatsapp_opted_in });
  await api.post('/leases/create/', {
    building_name: draft.building_name.trim(),
    area: draft.area.trim(),
    unit_number: draft.unit_number.trim(),
    address: composeAddress(draft),
    cheque_pattern: draft.cheque_pattern,
    start_date: draft.start_date,
    rent_amount: Number(draft.rent_amount.replace(/,/g, '')),
  });
  await auth.refreshUser();
  router.replace('/(onboarding)/celebrate');
}
