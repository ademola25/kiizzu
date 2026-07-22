import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { PillButton } from '@/components/ui/PillButton';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/store/auth';

type DeleteAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const CONFIRM_PHRASE = 'DELETE';

/**
 * Hard delete flow — per Story 6.3 AC, the user must type "DELETE" verbatim
 * to confirm. On success the auth store clears tokens; we replace the route
 * to the sign-in screen so they can't navigate back.
 */
export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset the confirmation each time the sheet opens.
  useEffect(() => {
    if (visible) setConfirm('');
  }, [visible]);

  const canDelete = confirm === CONFIRM_PHRASE && !busy;

  const run = async () => {
    if (!canDelete) return;
    setBusy(true);
    try {
      // On success the auth store flips to `signedOut`, the tabs subtree
      // unmounts via the gate in (tabs)/_layout, and this sheet goes with it
      // — so we DON'T clear busy / call onClose / navigate here. Doing so
      // would setState on an unmounted component. The route gate handles
      // the redirect; the explicit replace below is a belt-and-braces guard
      // in case the redirect hasn't fired yet.
      await deleteAccount();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      setBusy(false);
      Alert.alert("Couldn't delete account", errorMessage(err, 'Please try again.'));
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Delete your account?"
      subtitle="This wipes your lease, payment schedule, documents, and reminder history. It can't be undone."
    >
      <Text className="text-sm text-muted mb-2">
        Type <Text className="font-bold text-ink">{CONFIRM_PHRASE}</Text> to confirm.
      </Text>
      <Input
        label="Confirmation"
        autoCapitalize="characters"
        autoCorrect={false}
        value={confirm}
        onChangeText={setConfirm}
        placeholder={CONFIRM_PHRASE}
      />
      <View className="gap-3 mt-2">
        <PillButton
          label="Delete account"
          loading={busy}
          disabled={!canDelete}
          onPress={run}
        />
        <PillButton label="Keep my account" variant="secondary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
