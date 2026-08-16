import { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Frost } from '@/components/ui/Frost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COUNTRIES, SUGGESTED, countryByCode, type Country } from '@/lib/countries';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  /** Show the dial code instead of the currency as the trailing hint. */
  mode?: 'country' | 'dial';
  hint?: string;
};

/**
 * Country picker used by the property step (sets currency) and the phone field
 * (sets the dial code).
 *
 * Deliberately a plain Modal + FlatList rather than the shared BottomSheet:
 * the list is 50+ rows and needs virtualisation and a search field, which the
 * sheet primitive does not provide.
 *
 * Styling is inline rather than className — the onboarding flow standardised on
 * inline styles after function-form style props were found to be dropped in
 * Release builds. See the note in TentzuButton.
 */
export function CountrySelect({ label, value, onChange, mode = 'country', hint }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const selected = countryByCode(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // No search: launch markets first, then everyone else, no duplicates.
      const top = SUGGESTED.map((c) => countryByCode(c));
      const rest = COUNTRIES.filter((c) => !SUGGESTED.includes(c.code));
      return [...top, ...rest];
    }
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q ||
        c.dial.includes(q) ||
        c.currency.toLowerCase().includes(q),
    );
  }, [query]);

  const trailing = mode === 'dial' ? selected.dial : selected.currency;

  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text
          style={{
            fontFamily: tentzuFont.label,
            fontSize: 13,
            color: tentzu.inkVariant,
            marginBottom: 8,
            marginLeft: 2,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Country: ${selected.name}. Tap to change.`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: tentzu.glassStroke,
          paddingHorizontal: 14,
          height: 56,
          shadowColor: '#0b3b45',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1,
        }}
      >
        <Frost />
        <Text style={{ fontSize: 22 }}>{selected.flag}</Text>
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontFamily: tentzuFont.body, fontSize: 16, color: tentzu.ink }}
        >
          {selected.name}
        </Text>
        <Text style={{ fontFamily: tentzuFont.label, fontSize: 14, color: tentzu.mutedInk }}>
          {trailing}
        </Text>
        <Ionicons name="chevron-down" size={18} color={tentzu.mutedInk} />
      </Pressable>

      {hint ? (
        <Text
          style={{
            fontFamily: tentzuFont.body,
            fontSize: 13,
            color: tentzu.mutedInk,
            marginTop: 6,
            marginLeft: 2,
          }}
        >
          {hint}
        </Text>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: tentzu.bg, paddingTop: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingBottom: 12,
              gap: 12,
            }}
          >
            <Text style={{ flex: 1, fontFamily: tentzuFont.headlineBold, fontSize: 20, color: tentzu.ink }}>
              Select country
            </Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={tentzu.inkVariant} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: tentzu.field,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: tentzu.fieldBorder,
                paddingHorizontal: 14,
                height: 50,
              }}
            >
              <Ionicons name="search" size={18} color={tentzu.mutedInk} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search country, code or currency"
                placeholderTextColor={tentzu.mutedInk}
                selectionColor={tentzu.primary}
                autoCorrect={false}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  fontFamily: tentzuFont.body,
                  fontSize: 16,
                  color: tentzu.ink,
                  paddingVertical: 0,
                }}
              />
            </View>
          </View>

          <FlatList
            data={results}
            keyExtractor={(c: Country) => c.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            ListEmptyComponent={
              <Text
                style={{
                  fontFamily: tentzuFont.body,
                  fontSize: 15,
                  color: tentzu.mutedInk,
                  textAlign: 'center',
                  marginTop: 32,
                }}
              >
                No country matches “{query}”.
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.code === selected.code;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.code);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: isSelected ? tentzu.tintSurface : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                  <Text
                    style={{ flex: 1, fontFamily: tentzuFont.body, fontSize: 16, color: tentzu.ink }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{ fontFamily: tentzuFont.label, fontSize: 14, color: tentzu.mutedInk }}
                  >
                    {mode === 'dial' ? item.dial : item.currency}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={18} color={tentzu.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
