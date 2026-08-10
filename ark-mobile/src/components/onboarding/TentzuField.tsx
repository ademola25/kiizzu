import { forwardRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
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

      {/* Glass input: blurred backdrop + white fill, so the field belongs to the
          same material as the cards rather than sitting on top of them. The
          white fill is what guarantees contrast — legibility never depends on
          the blur landing, which matters on Android where it is cheaper. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: focused ? tentzu.primary : error ? tentzu.danger : tentzu.glassStroke,
          paddingHorizontal: 14,
          height: 56,
          shadowColor: focused ? tentzu.primary : '#0b3b45',
          shadowOpacity: focused ? 0.18 : 0.06,
          shadowRadius: focused ? 14 : 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: focused ? 3 : 1,
        }}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 22 : 34}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(255,255,255,${Platform.OS === 'android' ? 0.78 : 0.62})` },
          ]}
          pointerEvents="none"
        />
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
