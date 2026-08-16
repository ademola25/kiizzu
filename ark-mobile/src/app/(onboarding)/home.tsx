import { useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { TentzuField } from '@/components/onboarding/TentzuField';
import { CountrySelect } from '@/components/onboarding/CountrySelect';
import { SelectField } from '@/components/onboarding/SelectField';
import { AutocompleteField } from '@/components/onboarding/AutocompleteField';
import { HomeArt } from '@/components/onboarding/illustrations';
import { addressFormat } from '@/lib/addressFormats';
import {
  lookupPostcode,
  matchSubdivision,
  searchAddress,
  suggestPostcodes,
  type AddressSuggestion,
} from '@/lib/addressLookup';
import { currencyForCountry } from '@/lib/countries';
import { useOnboarding } from '@/store/onboarding';

const TOTAL = 14;

/**
 * Step 1/7 — where you rent.
 *
 * Country comes FIRST and drives everything below it: which fields exist, what
 * they are called, and what the dropdowns contain. Pick the UAE and there is no
 * postcode field, because the UAE has no postal codes; pick the US and you get
 * State + ZIP code; pick the UK and you get Postcode and no state at all.
 *
 * Autocomplete is an accelerator only — every field can be typed by hand. See
 * lib/addressLookup.ts for why that rule is non-negotiable.
 */
export default function HomeStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const fmt = addressFormat(draft.country);

  // Changing country invalidates anything scoped to the old one. Leaving a
  // Texas "state" selected after switching to Canada would submit nonsense.
  const prevCountry = useRef(draft.country);
  useEffect(() => {
    if (prevCountry.current !== draft.country) {
      prevCountry.current = draft.country;
      near.current = undefined;
      set('subdivision', '');
      set('postal_code', '');
      set('city', '');
      set('area', '');
    }
  }, [draft.country, set]);

  // Remember where the entered postcode is, so street suggestions rank that
  // area first. No free provider lists every address in a postcode (PAF is
  // licensed in the UK), so proximity bias is the closest achievable thing.
  const near = useRef<{ lat: number; lon: number } | undefined>(undefined);

  const fetchAddresses = useCallback(
    (q: string) => searchAddress(q, draft.country, near.current),
    [draft.country],
  );
  const fetchPostcodes = useCallback(
    (q: string) => suggestPostcodes(q, draft.country),
    [draft.country],
  );

  // Picking a suggestion fills every field it knows about — the point is that
  // the user types once and stops.
  const applySuggestion = (s: AddressSuggestion) => {
    const street = [s.houseNumber, s.street].filter(Boolean).join(' ');
    if (street) set('building_name', street);
    if (s.city) set('city', s.city);
    if (s.postcode && fmt.postal) set('postal_code', s.postcode);
    const code = matchSubdivision(draft.country, s.state);
    if (code) set('subdivision', code);
  };

  const applyPostcode = async (code: string) => {
    if (!code.trim()) return;
    const r = await lookupPostcode(code, draft.country);
    if (!r) return; // silent — the user can still type the city themselves
    if (typeof r.lat === 'number' && typeof r.lon === 'number') {
      near.current = { lat: r.lat, lon: r.lon };
    }
    if (r.postcode) set('postal_code', r.postcode);
    if (r.city && !draft.city.trim()) set('city', r.city);
    const sub = matchSubdivision(draft.country, r.state);
    if (sub) set('subdivision', sub);
  };

  const ready =
    draft.building_name.trim().length >= 2 &&
    draft.city.trim().length >= 2 &&
    (!fmt.unit.required || draft.unit_number.trim().length >= 1) &&
    (!fmt.subdivision?.required || draft.subdivision.length > 0) &&
    (!fmt.postal?.required || draft.postal_code.trim().length >= 3);

  return (
    <TentzuScreen
      step={8}
      total={TOTAL}
      illustration={<HomeArt />}
      title="Where is home?"
      subtitle="Start with your country and I'll ask for the rest the way your country writes it."
      primaryLabel="That's my place"
      primaryIcon="arrow-forward"
      primaryDisabled={!ready}
      onPrimary={() => router.push('/(onboarding)/home-type')}
    >
      <CountrySelect
        label="Country"
        value={draft.country}
        onChange={(code) => set('country', code)}
        hint={`Rent will be shown in ${currencyForCountry(draft.country)}.`}
      />

      {fmt.subdivision ? (
        <SelectField
          label={fmt.subdivision.label}
          placeholder={fmt.subdivision.placeholder}
          value={draft.subdivision}
          options={fmt.subdivision.options}
          onChange={(code) => set('subdivision', code)}
        />
      ) : null}

      {fmt.postal ? (
        draft.country === 'GB' ? (
          <AutocompleteField
            label={fmt.postal.label}
            placeholder={fmt.postal.placeholder}
            value={draft.postal_code}
            onChangeText={(v) => set('postal_code', v)}
            fetcher={fetchPostcodes}
            render={(pc: string) => pc}
            onSelect={(pc: string) => void applyPostcode(pc)}
            autoCapitalize="characters"
            hint="We'll fill in your town from this."
          />
        ) : (
          <TentzuField
            label={fmt.postal.label}
            placeholder={fmt.postal.placeholder}
            value={draft.postal_code}
            onChangeText={(v) => set('postal_code', v)}
            onBlur={() => void applyPostcode(draft.postal_code)}
            autoCapitalize="characters"
            returnKeyType="next"
            hint={fmt.postal.required ? undefined : 'Optional'}
          />
        )
      ) : null}

      <AutocompleteField
        label={fmt.street.label}
        placeholder={fmt.street.placeholder}
        value={draft.building_name}
        onChangeText={(v) => set('building_name', v)}
        fetcher={fetchAddresses}
        render={(s: AddressSuggestion) => s.label}
        onSelect={applySuggestion}
        hint={
          near.current
            ? 'Type your house number — we\'ll look around your postcode first.'
            : "Start typing and pick yours — we'll fill in the rest."
        }
      />

      <TentzuField
        label={fmt.city.label}
        placeholder={fmt.city.placeholder}
        value={draft.city}
        onChangeText={(v) => set('city', v)}
        autoCapitalize="words"
        returnKeyType="next"
      />

      <TentzuField
        label="Area or district (optional)"
        placeholder="e.g. Dubai Marina, The Annex"
        value={draft.area}
        onChangeText={(v) => set('area', v)}
        autoCapitalize="words"
        returnKeyType="next"
      />

      <TentzuField
        label={fmt.unit.label}
        placeholder={fmt.unit.placeholder}
        value={draft.unit_number}
        onChangeText={(v) => set('unit_number', v)}
        autoCapitalize="characters"
        returnKeyType="done"
      />
    </TentzuScreen>
  );
}
