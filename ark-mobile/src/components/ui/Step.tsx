import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PillButton } from './PillButton';
import { ProgressBar } from './ProgressBar';

type StepProps = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  onContinue: () => void;
  loading?: boolean;
  children: ReactNode;
};

/** Onboarding screen wrapper — progress + back + title + content + Continue. */
export function Step({
  step,
  total,
  title,
  subtitle,
  continueLabel = 'Continue',
  continueDisabled,
  onContinue,
  loading,
  children,
}: StepProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-paper"
    >
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center gap-3 mb-5">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 -ml-2 items-center justify-center"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={26} color="#000000" />
          </Pressable>
          <View className="flex-1">
            <ProgressBar step={step} total={total} />
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text className="text-3xl font-bold text-ink tracking-tight">{title}</Text>
        {subtitle ? (
          <Text className="text-base text-muted mt-2 mb-6">{subtitle}</Text>
        ) : (
          <View className="mb-6" />
        )}
        {children}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
        }}
      >
        <PillButton
          label={continueLabel}
          onPress={onContinue}
          disabled={continueDisabled}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
