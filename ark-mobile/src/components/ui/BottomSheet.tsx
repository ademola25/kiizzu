import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Modal bottom sheet used across Documents (upload), Settings (edit profile,
 * delete account), and anywhere else we need a focused action surface.
 * Native RN `Modal` works on iOS and Android with no extra deps; we wrap the
 * body in `KeyboardAvoidingView` because RN's Modal doesn't get the parent
 * activity's soft-input adjust on either platform.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={onClose}
          accessibilityLabel="Dismiss sheet"
        >
          <View className="flex-1" />
          {/*
           * Load-bearing no-op: this inner Pressable absorbs taps so a tap
           * on the sheet body doesn't bubble up to the backdrop's dismiss
           * handler. DO NOT REMOVE — replacing the wrapper with a View
           * re-enables backdrop-dismiss on body taps. accessible={false}
           * keeps screen readers from announcing it as a button.
           */}
          <Pressable
            accessible={false}
            onPress={() => {}}
            className="bg-paper rounded-t-3xl px-5 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-ink">{title}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="w-9 h-9 items-center justify-center rounded-full"
              >
                <Ionicons name="close" size={22} color="#000000" />
              </Pressable>
            </View>
            {subtitle ? <Text className="text-sm text-muted mb-4">{subtitle}</Text> : null}
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
