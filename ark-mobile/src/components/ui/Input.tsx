import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { tentzu } from '@/theme/tokens';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
};

/** Labeled text input — Cal AI minimal style: floating label + hairline border.
 *
 * Password fields get a show/hide toggle, matching TentzuField. Without it the
 * sign-in and register screens were the only masked fields in the app the user
 * could not check, which is the main source of password-entry errors. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, secureTextEntry, ...props },
  ref,
) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View className="mb-4">
      {label ? <Text className="text-sm text-muted mb-2">{label}</Text> : null}
      {/* The border lives on the row, not the input, so the toggle sits inside
          the field rather than beside it. */}
      <View
        className={cn(
          'h-14 px-4 rounded-2xl bg-paper border flex-row items-center',
          error ? 'border-danger' : 'border-line',
        )}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={tentzu.mutedInk}
          secureTextEntry={isPassword && !revealed}
          className={cn('flex-1 h-full text-base text-ink', className)}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            // 20pt icon in a 56pt row; hitSlop clears the 44pt minimum target
            // without moving the layout.
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={{ paddingLeft: 10, justifyContent: 'center' }}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={tentzu.mutedInk}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-danger mt-1">{error}</Text> : null}
    </View>
  );
});
