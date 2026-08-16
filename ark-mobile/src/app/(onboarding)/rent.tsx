import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { RentArt } from '@/components/onboarding/illustrations';
import { currencyForCountry } from '@/lib/countries';
import { useOnboarding } from '@/store/onboarding';
import { formatMoney, patternLabel } from '@/lib/schedule';
import { tentzu, tentzuFont } from '@/theme/tokens';

// Step 3/7 — total yearly rent. Stored as Lease.rent_amount (annual); the
// backend divides it by the cheque pattern.
export default function RentStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const currency = currencyForCountry(draft.country);

  const amount = Number(draft.rent_amount.replace(/,/g, ''));
  const valid = Number.isFinite(amount) && amount > 0;
  const pattern = draft.cheque_pattern;
  const perCheque = valid && pattern ? amount / pattern : null;

  return (
    <TentzuScreen
      step={3}
      total={7}
      illustration={<RentArt />}
      title="How much is the rent?"
      subtitle="Give me the yearly total and I'll work out each payment for you — you won't have to do the maths."
      primaryLabel="Work it out for me"
      primaryIcon="arrow-forward"
      primaryDisabled={!valid}
      onPrimary={() => router.push('/(onboarding)/due-date')}
    >
      <TentzuField
        label="Total annual rent"
        prefix={currency}
        placeholder="90,000"
        keyboardType="number-pad"
        value={draft.rent_amount}
        onChangeText={(v) => set('rent_amount', v.replace(/[^0-9.,]/g, ''))}
      />

      {perCheque !== null && pattern ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: tentzu.tintSurface,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginTop: 4,
          }}
        >
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 14, color: tentzu.inkVariant, flex: 1 }}>
            That's{' '}
            <Text style={{ fontFamily: tentzuFont.label, color: tentzu.primary }}>{formatMoney(perCheque, currency)}</Text> per
            cheque, {patternLabel[pattern].sub.toLowerCase()}.
          </Text>
        </View>
      ) : null}
    </TentzuScreen>
  );
}
