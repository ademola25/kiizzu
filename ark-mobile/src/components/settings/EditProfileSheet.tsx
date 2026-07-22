import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { PillButton } from '@/components/ui/PillButton';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/store/auth';

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
};

// Backend's User.phone column has a UAE validator; mirror it here so the
// user sees the constraint locally instead of waiting for a 400.
const UAE_PHONE = /^\+971\d{9}$/;

/** Edit name + phone. Email is read-only (backend doesn't support change yet). */
export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  // Re-seed ONLY when the sheet opens. Listening to user.name/phone here
  // would silently overwrite the user's in-progress edits if the store
  // updated (e.g. from a background refresh) while the sheet is open.
  useEffect(() => {
    if (visible) {
      setName(user?.name ?? '');
      setPhone(user?.phone ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const dirty = trimmedName !== (user?.name ?? '') || trimmedPhone !== (user?.phone ?? '');
  const phoneValid = UAE_PHONE.test(trimmedPhone);
  const nameValid = trimmedName.length >= 2;
  const valid = nameValid && phoneValid;

  const save = async () => {
    if (saving || !valid || !dirty) return;
    setSaving(true);
    try {
      await updateProfile({ name: trimmedName, phone: trimmedPhone });
      onClose();
    } catch (err) {
      Alert.alert("Couldn't save", errorMessage(err, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit profile"
      subtitle="Update the details on your account."
    >
      <Input
        label="Full name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        autoCapitalize="words"
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="+971XXXXXXXXX"
        error={phone.length >= 4 && !phoneValid ? 'Use UAE format: +971 followed by 9 digits' : undefined}
      />

      {/* Email is intentionally read-only — backend doesn't support change yet. */}
      <View className="mb-4">
        <Text className="text-sm text-muted mb-2">Email</Text>
        <View className="h-14 px-4 rounded-2xl bg-mist border border-line justify-center">
          <Text className="text-base text-muted" numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
        </View>
        <Text className="text-xs text-muted mt-1">
          Email changes aren't available yet — contact support if you need this.
        </Text>
      </View>

      <PillButton
        label="Save changes"
        loading={saving}
        disabled={!dirty || !valid || saving}
        onPress={save}
      />
    </BottomSheet>
  );
}
