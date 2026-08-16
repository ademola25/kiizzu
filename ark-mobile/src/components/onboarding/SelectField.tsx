import { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Frost } from '@/components/ui/Frost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { tentzu, tentzuFont } from '@/theme/tokens';

export type Option = { code: string; name: string };

type Props = {
  label: string;
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (code: string) => void;
  error?: string;
  hint?: string;
};

/**
 * Searchable dropdown for fixed lists — states, provinces, emirates, counties.
 *
 * Search is included because these lists run to 50+ entries (US states, Indian
 * states, Nigerian states) and scrolling to "Wyoming" is exactly the friction
 * we are trying to remove.
 *
 * Inline styles, not className: the onboarding flow standardised on them after
 * function-form style props were found to be dropped in Release builds.
 */
export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  hint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const selected = options.find((o) => o.code === value) ?? null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase() === q,
    );
  }, [query, options]);

  const borderColor = error ? tentzu.danger : tentzu.fieldBorder;

  return (
    <View style={{ marginBottom: 16 }}>
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

      <Pressable
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? 'not set'}. Tap to change.`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: error ? tentzu.danger : tentzu.glassStroke,
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
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: tentzuFont.body,
            fontSize: 16,
            color: selected ? tentzu.ink : tentzu.mutedInk,
          }}
        >
          {selected?.name ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={tentzu.mutedInk} />
      </Pressable>

      {error ? (
        <Text
          style={{
            fontFamily: tentzuFont.body,
            fontSize: 13,
            color: tentzu.danger,
            marginTop: 6,
            marginLeft: 2,
          }}
        >
          {error}
        </Text>
      ) : hint ? (
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
            <Text
              style={{ flex: 1, fontFamily: tentzuFont.headlineBold, fontSize: 20, color: tentzu.ink }}
            >
              {label}
            </Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={tentzu.inkVariant} />
            </Pressable>
          </View>

          {options.length > 12 ? (
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
                  placeholder="Search"
                  placeholderTextColor={tentzu.mutedInk}
                  selectionColor={tentzu.primary}
                  autoCorrect={false}
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
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(o) => o.code}
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
                Nothing matches “{query}”.
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.code === value;
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
                  <Text
                    style={{ flex: 1, fontFamily: tentzuFont.body, fontSize: 16, color: tentzu.ink }}
                  >
                    {item.name}
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
