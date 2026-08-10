import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TentzuField } from './TentzuField';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props<T> = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  /** Returns suggestions for the current text. Must never throw. */
  fetcher: (query: string) => Promise<T[]>;
  /** Row label. */
  render: (item: T) => string;
  onSelect: (item: T) => void;
  hint?: string;
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric';
};

const DEBOUNCE_MS = 350;

/**
 * Text field with type-ahead suggestions.
 *
 * The field is always freely typeable — suggestions are an accelerator. If the
 * lookup service is slow, throttled or offline, the user simply types the
 * address and nothing blocks them. That matters because the providers we use
 * are free and keyless and make no availability promise.
 *
 * Debounced at 350ms with a 3-character minimum to stay well inside "fair use"
 * on those services: without it, every keystroke would be a request.
 */
export function AutocompleteField<T>({
  label,
  placeholder,
  value,
  onChangeText,
  fetcher,
  render,
  onSelect,
  hint,
  error,
  autoCapitalize = 'words',
  keyboardType = 'default',
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Guards against a slow earlier request landing after a newer one and
  // repopulating the list with stale results.
  const seq = useRef(0);

  useEffect(() => {
    if (dismissed) return;
    const q = value.trim();
    if (q.length < 3) {
      setItems([]);
      return;
    }
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const next = await fetcher(q).catch(() => [] as T[]);
      if (mine === seq.current) {
        setItems(next);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      if (mine === seq.current) setLoading(false);
    };
  }, [value, fetcher, dismissed]);

  const handleChange = useCallback(
    (v: string) => {
      setDismissed(false);
      onChangeText(v);
    },
    [onChangeText],
  );

  const choose = (item: T) => {
    onSelect(item);
    setItems([]);
    setDismissed(true); // don't immediately re-query the text we just filled in
  };

  return (
    <View style={{ marginBottom: items.length ? 4 : 0 }}>
      <TentzuField
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChange}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
        hint={hint}
        error={error}
      />

      {loading && !items.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, marginBottom: 12, marginLeft: 4 }}>
          <ActivityIndicator size="small" color={tentzu.primary} />
          <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk }}>
            Looking up addresses…
          </Text>
        </View>
      ) : null}

      {items.length ? (
        <View
          style={{
            marginTop: -8,
            marginBottom: 14,
            backgroundColor: tentzu.card,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: tentzu.fieldBorder,
            overflow: 'hidden',
          }}
        >
          {items.map((item, i) => (
            <Pressable
              key={`${render(item)}-${i}`}
              onPress={() => choose(item)}
              accessibilityRole="button"
              style={{
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: tentzu.fieldBorder,
              }}
            >
              <Text
                numberOfLines={2}
                style={{ fontFamily: tentzuFont.body, fontSize: 15, color: tentzu.ink }}
              >
                {render(item)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
