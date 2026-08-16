import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuCalendar } from '@/components/onboarding/TentzuCalendar';
import { useOnboarding } from '@/store/onboarding';
import { formatLongDate, isValidISODate, todayISO } from '@/lib/schedule';
import { tentzu, tentzuFont } from '@/theme/tokens';

// Step 4/7 — first cheque due date. Stored as Lease.start_date; the schedule
// engine counts forward from here.
export default function DueDateStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const valid = isValidISODate(draft.start_date);

  return (
    <TentzuScreen
      backdrop="photo"
      step={4}
      total={7}
      title="First, when is rent due?"
      subtitle="Tell me the date of your next payment. I'll remember it and remind you before it's late."
      primaryLabel="Got it"
      primaryIcon="arrow-forward"
      primaryDisabled={!valid}
      onPrimary={() => router.push('/(onboarding)/reminders')}
    >
      <TentzuCalendar
        value={valid ? draft.start_date : null}
        minISO={todayISO()}
        onChange={(iso) => set('start_date', iso)}
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
          <Ionicons name="calendar" size={18} color={tentzu.primary} />
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 14, color: tentzu.inkVariant, flex: 1 }}>
            Next cheque due{' '}
            <Text style={{ fontFamily: tentzuFont.label, color: tentzu.primary }}>
              {formatLongDate(draft.start_date)}
            </Text>
            .
          </Text>
        </View>
      ) : null}
    </TentzuScreen>
  );
}
