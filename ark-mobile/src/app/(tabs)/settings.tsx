import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLease } from '@/api/leases';
import { useSubscription } from '@/api/billing';
import { PlanCard } from '@/components/billing/PlanCard';
import { UpgradeSheet } from '@/components/billing/UpgradeSheet';
import { ChannelsCard } from '@/components/settings/ChannelsCard';
import { DeleteAccountSheet } from '@/components/settings/DeleteAccountSheet';
import { EditProfileSheet } from '@/components/settings/EditProfileSheet';
import { PushCard } from '@/components/settings/PushCard';
import { Card } from '@/components/ui/Card';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StateCard } from '@/components/ui/StateCard';
import { formatMoney, formatDate } from '@/lib/format';
import type { ChequePattern } from '@/lib/types';
import { useAuth } from '@/store/auth';

const PATTERN_LABEL: Record<ChequePattern, string> = {
  1: 'Annual',
  2: 'Bi-annual',
  3: '3 payments',
  4: 'Quarterly',
  6: 'Bi-monthly',
  12: 'Monthly',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const lease = useLease();
  const subscription = useSubscription();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleLogout = async () => {
    // Flip the session and stop — do NOT navigate. The router ejects us on its
    // own once the guard in app/_layout.tsx turns false. Navigating from here
    // as well put a second mover in play, and the resulting redirect loop
    // froze the UI, which is how this button came to look like a dead one.
    await logout();
  };

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 108,
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

        {/* Reminders — all four channels, gated by plan. */}
        <ChannelsCard onUpgrade={() => setUpgradeOpen(true)} />

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
                {/* area is optional outside the Gulf — join only the parts we
                    actually have so this never renders a dangling " · ". */}
                {[lease.data.area, lease.data.city, `Unit ${lease.data.unit_number}`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text className="text-sm text-muted mt-2">
                {PATTERN_LABEL[lease.data.cheque_pattern]} ·{' '}
                {formatMoney(lease.data.rent_amount, lease.data.currency)} / year
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
          <Text className="text-sm font-semibold text-danger">Delete account</Text>
        </Pressable>
      </ScrollView>

      <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} />
      <UpgradeSheet visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <DeleteAccountSheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </View>
  );
}
