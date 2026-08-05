import { forwardRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  prefix?: string; // e.g. "AED"
  hint?: string;
};

// Labeled input with a turquoise focus ring. Label sits above the field
// (bold, small) per the TENTZU spec; error/hint below.
export const TentzuField = forwardRef<TextInput, Props>(function TentzuField(
  { label, error, prefix, hint, style, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? tentzu.danger : focused ? tentzu.primary : tentzu.fieldBorder;

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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: tentzu.field,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 14,
          height: 56,
          shadowColor: tentzu.primary,
          shadowOpacity: focused ? 0.1 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {prefix ? (
          <Text
            style={{
              fontFamily: tentzuFont.label,
              fontSize: 16,
              color: tentzu.mutedInk,
              marginRight: 8,
            }}
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={tentzu.mutedInk}
          selectionColor={tentzu.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              fontFamily: tentzuFont.body,
              fontSize: 16,
              color: tentzu.ink,
              height: '100%',
              paddingVertical: 0,
            },
            style,
          ]}
          {...props}
        />
      </View>

      {error ? (
        <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.danger, marginTop: 6, marginLeft: 2 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk, marginTop: 6, marginLeft: 2 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
