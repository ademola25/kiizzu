import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useLease } from '@/api/leases';
import { useSubscription } from '@/api/billing';
import { PlanCard } from '@/components/billing/PlanCard';
import { UpgradeSheet } from '@/components/billing/UpgradeSheet';
import { DeleteAccountSheet } from '@/components/settings/DeleteAccountSheet';
import { EditProfileSheet } from '@/components/settings/EditProfileSheet';
import { PushCard } from '@/components/settings/PushCard';
import { Card } from '@/components/ui/Card';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StateCard } from '@/components/ui/StateCard';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { errorMessage } from '@/lib/errors';
import { formatAED, formatDate } from '@/lib/format';
import type { ChequePattern } from '@/lib/types';
import { useAuth } from '@/store/auth';

const PATTERN_LABEL: Record<ChequePattern, string> = {
  1: 'Annual',
  2: 'Bi-annual',
  3: '3 cheques',
  4: 'Quarterly',
  6: 'Bi-monthly',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);
  const logout = useAuth((s) => s.logout);
  const lease = useLease();
  const subscription = useSubscription();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Free tier means WhatsApp is gated. Only treat the user as free when the
  // subscription query has resolved — during loading/error we let the write
  // attempt through rather than intercept a paying user with an upgrade sheet.
  const isFree =
    !subscription.isLoading &&
    !subscription.isError &&
    subscription.data?.tier === 'free';

  // Optimistic mirror of the server's whatsapp_opted_in so the Switch moves
  // instantly when tapped — the controlled `value` would otherwise be stuck
  // on the server value until the PATCH round-trips.
  const [waOptimistic, setWaOptimistic] = useState(!!user?.whatsapp_opted_in);
  const [waBusy, setWaBusy] = useState(false);

  useEffect(() => {
    if (!waBusy) setWaOptimistic(!!user?.whatsapp_opted_in);
  }, [user?.whatsapp_opted_in, waBusy]);

  const toggleWhatsApp = async (next: boolean) => {
    if (waBusy) return;
    // Free tier intercept: only intercept *turning on* — turning off is
    // always allowed (someone who just downgraded should be able to opt out).
    if (next && isFree) {
      // The native Switch animates its thumb on tap before onValueChange
      // returns; this explicit reset keeps the controlled value pinned to
      // the prior state so the thumb doesn't briefly flash "on".
      setWaOptimistic(false);
      setUpgradeOpen(true);
      return;
    }
    const prev = waOptimistic;
    setWaOptimistic(next);
    setWaBusy(true);
    try {
      await updateProfile({ whatsapp_opted_in: next });
    } catch (err) {
      setWaOptimistic(prev);
      Alert.alert("Couldn't update preference", errorMessage(err, 'Please try again.'));
    } finally {
      setWaBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <View className="flex-1 bg-mist">
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          gap: 16,
        }}
      >
        <ScreenHeader title="Settings" />

        {/* Account */}
        <Card>
          <Text className="text-xs uppercase tracking-widest text-muted">Account</Text>
          <Text className="text-base font-semibold text-ink mt-2">{user?.name ?? '—'}</Text>
          <Text className="text-sm text-muted mt-0.5">{user?.email ?? ''}</Text>
          {user?.phone ? <Text className="text-sm text-muted">{user.phone}</Text> : null}
          <View className="mt-4">
            <PillButton
              label="Edit profile"
              variant="secondary"
              onPress={() => setEditOpen(true)}
            />
          </View>
        </Card>

        {/* Plan — drives the upgrade entry point. */}
        <PlanCard
          tier={subscription.data?.tier}
          loading={subscription.isLoading}
          onUpgrade={() => setUpgradeOpen(true)}
        />

        {/* Push — OS-level affordance; token-backend sync is a follow-up. */}
        <PushCard />

        {/* Reminders — only the real, backend-supported toggle. */}
        <Card>
          <Text className="text-xs uppercase tracking-widest text-muted mb-2">
            Reminders
          </Text>
          <ToggleRow
            label="WhatsApp reminders"
            description="We'll message you 30, 7, and 1 day before each cheque."
            value={waOptimistic}
            onValueChange={toggleWhatsApp}
            disabled={waBusy}
          />
          <Text className="text-xs text-muted mt-3">
            Email reminders are always on. Per-window timing controls are coming soon.
          </Text>
        </Card>

        {/* Lease summary — read-only for now (edit comes with Story 3.2). */}
        {lease.isLoading ? (
          <StateCard variant="loading" />
        ) : lease.isError ? (
          <StateCard
            variant="error"
            title="Couldn't load lease"
            message="Pull to refresh from the dashboard."
          />
        ) : lease.data ? (
          <Card>
            <Text className="text-xs uppercase tracking-widest text-muted">Lease</Text>
            <View className="mt-2 gap-1">
              <Text className="text-base font-semibold text-ink">
                {lease.data.building_name}
              </Text>
              <Text className="text-sm text-muted">
                {lease.data.area} · Unit {lease.data.unit_number}
              </Text>
              <Text className="text-sm text-muted mt-2">
                {PATTERN_LABEL[lease.data.cheque_pattern]} ·{' '}
                {formatAED(lease.data.rent_amount)} / year
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                Starts {formatDate(lease.data.start_date)}
              </Text>
              <Text className="text-xs text-muted mt-3">
                Editing your lease will be available in a future update.
              </Text>
            </View>
          </Card>
        ) : (
          <StateCard
            variant="empty"
            title="No lease set up yet"
            message="Finish onboarding to add your cheque schedule."
          />
        )}

        {/* Sign out — non-destructive. */}
        <View className="mt-2">
          <PillButton label="Log out" variant="secondary" onPress={handleLogout} />
        </View>

        {/* Danger zone — destructive, gated by typing DELETE. */}
        <Pressable
          onPress={() => setDeleteOpen(true)}
          className="mt-2 items-center py-2"
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          accessibilityHint="Opens a confirmation sheet — destructive, can't be undone"
        >
          <Text className="text-sm font-semibold text-flame">Delete account</Text>
        </Pressable>
      </ScrollView>

      <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} />
      <UpgradeSheet visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <DeleteAccountSheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </View>
  );
}
