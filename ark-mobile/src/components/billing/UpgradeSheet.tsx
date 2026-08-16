import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import type { AxiosError } from 'axios';

import {
  STARTER_PRICE_LABEL,
  useCreateCheckout,
  useInvalidateSubscription,
} from '@/api/billing';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PillButton } from '@/components/ui/PillButton';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/theme/tokens';

type UpgradeSheetProps = {
  visible: boolean;
  onClose: () => void;
};

// Bullet list of what unlocks at Starter. Kept narrowly factual — there's no
// in-app cancel today, so we don't promise one.
const BENEFITS = [
  'WhatsApp reminders 30, 7, and 1 day before each cheque',
  'Email and SMS alongside WhatsApp, so a reminder never gets missed',
  'Cancel by replying to your Stripe receipt email',
];

/**
 * Walks the user through Stripe hosted checkout. We register the *base*
 * /billing-return URL as the redirect so `openAuthSessionAsync` can match
 * both success and cancel returns on its URL prefix; the actual outcome
 * comes from the `status` query param in `result.url`.
 */
export function UpgradeSheet({ visible, onClose }: UpgradeSheetProps) {
  const createCheckout = useCreateCheckout();
  const invalidateSubscription = useInvalidateSubscription();
  const [busy, setBusy] = useState(false);

  const upgrade = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { checkoutUrl, returnUrl } = await createCheckout.mutateAsync({ tier: 'starter' });

      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl, {
        showInRecents: false,
      });

      if (result.type === 'success') {
        const cancelled = (result.url ?? '').includes('status=cancel');
        if (!cancelled) {
          // Stripe webhook may lag the redirect by a moment — invalidate so
          // the next read is fresh, and tell the user it's settling rather
          // than promising it's already done.
          await invalidateSubscription();
          onClose();
          Alert.alert(
            'Activating your plan',
            'Thanks for upgrading. Your Starter plan should appear in a moment.',
          );
        }
        // explicit cancel: leave the sheet open so the user can retry
      }
      // 'cancel'/'dismiss'/'locked' all leave the user where they were.
    } catch (err) {
      Alert.alert("Couldn't start checkout", checkoutErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Upgrade to Starter"
      subtitle={`${STARTER_PRICE_LABEL}. Pause or cancel via your Stripe receipt email.`}
    >
      <View className="gap-3 mb-4">
        {BENEFITS.map((line) => (
          <View key={line} className="flex-row items-start gap-3">
            <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
            <Text className="text-base text-ink flex-1">{line}</Text>
          </View>
        ))}
      </View>

      <View className="gap-3">
        <PillButton
          label={busy ? 'Opening checkout…' : `Continue to checkout · ${STARTER_PRICE_LABEL}`}
          loading={busy}
          disabled={busy}
          onPress={upgrade}
        />
        <PillButton label="Maybe later" variant="secondary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

/**
 * Distinguish the two common dev-time failures from a generic error:
 *   503 → backend isn't wired to Stripe yet
 *   502 → backend reached Stripe but it errored (e.g. placeholder price IDs)
 * Both are non-actionable for the user, but the wording matters for QA.
 */
function checkoutErrorMessage(err: unknown): string {
  const status = (err as AxiosError | undefined)?.response?.status;
  if (status === 503) {
    return "Billing isn't configured for this build — try again from a release build.";
  }
  if (status === 502) {
    return "Our payments provider rejected the request — likely a configuration gap on our side.";
  }
  return errorMessage(err, 'Billing is taking a break — please try again shortly.');
}
