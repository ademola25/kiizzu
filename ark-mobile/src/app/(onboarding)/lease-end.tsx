import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuCalendar } from '@/components/onboarding/TentzuCalendar';
import { useOnboarding } from '@/store/onboarding';
import { addMonths, formatLongDate, isValidISODate, todayISO } from '@/lib/schedule';
import { tentzu, tentzuFont } from '@/theme/tokens';

/**
 * Step 10/14 — "Your lease ends…"
 *
 * The promise here is concrete: 90/60/30-day renewal reminders. Skippable,
 * because plenty of tenants genuinely do not know the end date at signup and
 * we would rather have them finish than guess.
 */
export default function LeaseEndStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const valid = isValidISODate(draft.lease_end_date);

  // Most leases run a year from the first payment — offer that as the default
  // rather than an empty calendar.
  const suggested = isValidISODate(draft.start_date)
    ? addMonths(draft.start_date, 12)
    : null;

  const next = () => router.push('/(onboarding)/plan');

  return (
    <TentzuScreen
      step={10}
      total={14}
      title="When does your lease end?"
      subtitle="I'll remind you 90, 60 and 30 days before, so you can renew or move without a scramble."
      primaryLabel={valid ? 'Set my renewal reminders' : 'Continue'}
      primaryIcon="arrow-forward"
      onPrimary={next}
      secondaryLabel="I don't know yet"
      onSecondary={() => {
        set('lease_end_date', '');
        next();
      }}
    >
      <TentzuCalendar
        value={valid ? draft.lease_end_date : suggested}
        minISO={todayISO()}
        onChange={(iso) => set('lease_end_date', iso)}
      />

      {valid ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: tentzu.tintSurface,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginTop: 16,
          }}
        >
          <Ionicons name="notifications-outline" size={18} color={tentzu.primary} />
          <Text style={{ flex: 1, fontFamily: tentzuFont.body, fontSize: 14, color: tentzu.inkVariant }}>
            I'll nudge you from {formatLongDate(addMonths(draft.lease_end_date, -3))}.
          </Text>
        </View>
      ) : null}
    </TentzuScreen>
  );
}
