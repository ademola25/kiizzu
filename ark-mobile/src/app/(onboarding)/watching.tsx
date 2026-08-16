import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { useOnboarding } from '@/store/onboarding';
import { currencyForCountry } from '@/lib/countries';
import { subdivisionName } from '@/lib/addressFormats';
import {
  formatLongDate,
  formatMoney,
  isValidISODate,
  previewSchedule,
} from '@/lib/schedule';
import { tentzu, tentzuFont } from '@/theme/tokens';

/**
 * Step 12/14 — "You're all set. Here's what I'm watching."
 *
 * The proposal's "show output, not input". Everything on this screen is
 * something the user told us, reflected back as a commitment — this is where
 * the assistant framing either pays off or rings hollow, so every line is a
 * real value, never a placeholder.
 */
export default function WatchingStep() {
  const draft = useOnboarding((s) => s.draft);
  const currency = currencyForCountry(draft.country);

  const amount = Number(draft.rent_amount.replace(/,/g, '')) || 0;
  const schedule =
    draft.cheque_pattern && isValidISODate(draft.start_date) && amount > 0
      ? previewSchedule(draft.start_date, draft.cheque_pattern, amount)
      : [];
  const next = schedule[0];

  const place = [draft.building_name.trim(), draft.city.trim()].filter(Boolean).join(', ');
  const region = draft.subdivision ? subdivisionName(draft.country, draft.subdivision) : '';

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
  if (next) {
    rows.push({
      icon: 'cash-outline',
      label: 'Next payment',
      value: `${formatMoney(next.amount, currency)} on ${formatLongDate(next.due_date)}`,
    });
  }
  if (schedule.length) {
    rows.push({
      icon: 'repeat-outline',
      label: 'After that',
      value: `${schedule.length} payment${schedule.length === 1 ? '' : 's'} a year — I'll warn you 30, 7 and 1 day before each`,
    });
  }
  if (place) {
    rows.push({
      icon: 'home-outline',
      label: 'Your home',
      value: [place, region].filter(Boolean).join(', '),
    });
  }
  if (draft.lease_document_name) {
    rows.push({
      icon: 'document-text-outline',
      label: 'Documents',
      value: `${draft.lease_document_name} — stored once your account is saved`,
    });
  }
  if (isValidISODate(draft.lease_end_date)) {
    rows.push({
      icon: 'calendar-outline',
      label: 'Renewal',
      value: `Lease ends ${formatLongDate(draft.lease_end_date)} — I'll start reminding you 90 days out`,
    });
  }
  if (draft.contacts.length) {
    rows.push({
      icon: 'call-outline',
      label: 'If something breaks',
      value: draft.contacts
        .map((c) => c.name.trim() || c.label)
        .join(', '),
    });
  }

  return (
    <TentzuScreen
      step={12}
      total={14}
      title="You're all set. Here's what I'm watching."
      subtitle="This is everything I'll keep an eye on for you. Change any of it whenever you like."
      primaryLabel="Looks good"
      primaryIcon="arrow-forward"
      onPrimary={() => router.push('/(onboarding)/extras')}
    >
      <View style={{ gap: 12 }}>
        {rows.map((r) => (
          <View
            key={r.label}
            style={{
              flexDirection: 'row',
              gap: 14,
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.55)',
              backgroundColor: 'rgba(255,255,255,0.68)',
              paddingVertical: 16,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tentzu.tintSurface,
              }}
            >
              <Ionicons name={r.icon} size={19} color={tentzu.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontFamily: tentzuFont.label, fontSize: 13, color: tentzu.mutedInk }}
              >
                {r.label}
              </Text>
              <Text
                style={{
                  fontFamily: tentzuFont.body,
                  fontSize: 15,
                  lineHeight: 21,
                  color: tentzu.ink,
                  marginTop: 2,
                }}
              >
                {r.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </TentzuScreen>
  );
}
