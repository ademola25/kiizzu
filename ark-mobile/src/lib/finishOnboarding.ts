import { router } from 'expo-router';

import { uploadDocument } from '@/api/documents';
import { api } from '@/lib/api';
import { currencyForCountry, deviceTimezone } from '@/lib/countries';
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
  // Send the device timezone alongside the WhatsApp preference: reminder
  // windows are computed in the tenant's own local day server-side, and the
  // default (Asia/Dubai) is wrong for everyone outside the Gulf.
  await auth.updateProfile({
    whatsapp_opted_in: draft.whatsapp_opted_in,
    timezone: deviceTimezone(),
  });
  await api.post('/leases/create/', {
    building_name: draft.building_name.trim(),
    area: draft.area.trim(),
    city: draft.city.trim(),
    subdivision: draft.subdivision,
    postal_code: draft.postal_code.trim(),
    country: draft.country,
    currency: currencyForCountry(draft.country),
    unit_number: draft.unit_number.trim(),
    address: composeAddress(draft),
    home_type: draft.home_type || '',
    lease_end_date: draft.lease_end_date || null,
    contacts: draft.contacts,
    cheque_pattern: draft.cheque_pattern,
    start_date: draft.start_date,
    rent_amount: Number(draft.rent_amount.replace(/,/g, '')),
  });

  // Upload the lease the user picked at step 7. It could not be sent then —
  // that step is unauthenticated — and the screen promised "I'll store this
  // once your account is saved", so this is where we keep that promise.
  //
  // Deliberately non-fatal: the account and lease already exist, and failing
  // the whole signup over a document would be a far worse outcome than an
  // un-uploaded file the user can add from Documents. The lease itself is
  // never at risk here.
  if (draft.lease_document_uri && draft.lease_document_name) {
    try {
      await uploadDocument({
        file: {
          uri: draft.lease_document_uri,
          name: draft.lease_document_name,
          mimeType: draft.lease_document_mime ?? 'application/pdf',
          size: draft.lease_document_size ?? 0,
        },
        documentType: 'lease',
      });
    } catch {
      // Swallowed on purpose — see above.
    }
  }

  await auth.refreshUser();
  router.replace('/(onboarding)/celebrate');
}
