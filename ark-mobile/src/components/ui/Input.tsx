import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
};

/** Labeled text input — Cal AI minimal style: floating label + hairline border. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, ...props },
  ref,
) {
  return (
    <View className="mb-4">
      {label ? <Text className="text-sm text-muted mb-2">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#6b7a79"
        className={cn(
          'h-14 px-4 rounded-2xl bg-paper border text-base text-ink',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {error ? <Text className="text-xs text-danger mt-1">{error}</Text> : null}
    </View>
  );
});
