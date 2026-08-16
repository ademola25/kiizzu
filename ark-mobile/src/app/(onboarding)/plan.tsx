import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { PlanArt } from '@/components/onboarding/illustrations';
import { currencyForCountry } from '@/lib/countries';
import { composeAddress, useOnboarding } from '@/store/onboarding';
import {
  formatMoney,
  formatLongDate,
  formatShortDate,
  isValidISODate,
  previewSchedule,
} from '@/lib/schedule';
import { tentzu, tentzuFont } from '@/theme/tokens';

// Step 6/7 — a preview of the cheque plan Tentzu will track. Computed locally to
// mirror the backend engine; the real schedule is created on submit.
export default function PlanStep() {
  const draft = useOnboarding((s) => s.draft);
  const currency = currencyForCountry(draft.country);

  const amount = Number(draft.rent_amount.replace(/,/g, ''));
  const ready =
    !!draft.cheque_pattern && isValidISODate(draft.start_date) && Number.isFinite(amount) && amount > 0;

  const cheques = ready
    ? previewSchedule(draft.start_date, draft.cheque_pattern!, amount)
    : [];

  return (
    <TentzuScreen
      backdrop="photo"
      step={11}
      total={14}
      illustration={<PlanArt />}
      title="Here's your rent plan."
      subtitle={
        cheques.length
          ? `I've set up ${cheques.length} payment${cheques.length === 1 ? '' : 's'}: ${cheques
              .slice(0, 3)
              .map((c) => formatShortDate(c.due_date))
              .join(', ')}${cheques.length > 3 ? '…' : ''}. I'll ping you before each one.`
          : "I'll lay out every payment here once I have your dates."
      }
      primaryLabel="Looks right"
      primaryIcon="arrow-forward"
      primaryDisabled={!ready}
      onPrimary={() => router.push('/(onboarding)/watching')}
    >
      {/* Home summary */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: tentzu.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tentzu.fieldBorder,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tentzu.tintSurface,
          }}
        >
          <Ionicons name="home" size={20} color={tentzu.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: tentzuFont.label, fontSize: 15, color: tentzu.ink }}>
            {draft.building_name.trim() || 'Your home'}
          </Text>
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk, marginTop: 2 }}>
            {composeAddress(draft)}
          </Text>
        </View>
      </View>

      {/* Cheque list */}
      <View
        style={{
          backgroundColor: tentzu.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tentzu.fieldBorder,
          paddingVertical: 6,
          paddingHorizontal: 16,
        }}
      >
        {cheques.map((c, i) => (
          <View
            key={c.cheque_number}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: tentzu.track,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tentzu.tintSurface,
              }}
            >
              <Text style={{ fontFamily: tentzuFont.label, fontSize: 13, color: tentzu.primary }}>
                {c.cheque_number}
              </Text>
            </View>
            <Text style={{ fontFamily: tentzuFont.body, fontSize: 14.5, color: tentzu.ink, flex: 1 }}>
              {formatLongDate(c.due_date)}
            </Text>
            <Text style={{ fontFamily: tentzuFont.label, fontSize: 14.5, color: tentzu.ink }}>
              {formatMoney(c.amount, currency)}
            </Text>
          </View>
        ))}
      </View>

      {/* Reminder note */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 2 }}>
        <Ionicons name="notifications-outline" size={16} color={tentzu.primary} />
        <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk, flex: 1 }}>
          Tentzu reminds you 30, 7 and 1 day before each cheque
          {draft.notify_in_app ? ', right here in the app' : ''}.
        </Text>
      </View>
    </TentzuScreen>
  );
}
