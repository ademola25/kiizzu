import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  onComplete?: (v: string) => void;
};

// Segmented one-time-code field: `length` boxes over a single hidden input.
// Tapping anywhere focuses it; supports OS autofill of SMS/email codes.
export function TentzuCodeInput({ value, onChange, length = 6, autoFocus, onComplete }: Props) {
  const ref = useRef<TextInput>(null);
  const focus = () => ref.current?.focus();

  return (
    <Pressable onPress={focus} accessibilityLabel="Verification code" accessibilityRole="none">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? '';
          const active = i === value.length || (i === length - 1 && value.length === length);
          return (
            <View
              key={i}
              style={{
                width: 48,
                height: 58,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: char ? tentzu.primary : active ? tentzu.primaryBright : tentzu.fieldBorder,
                backgroundColor: char ? tentzu.tintSurface : tentzu.field,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: tentzuFont.headline, fontSize: 24, color: tentzu.ink }}>{char}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        selectionColor="transparent"
        onChangeText={(t) => {
          const clean = t.replace(/\D/g, '').slice(0, length);
          onChange(clean);
          if (clean.length === length) onComplete?.(clean);
        }}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
      />
    </Pressable>
  );
}
