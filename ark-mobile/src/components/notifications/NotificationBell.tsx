import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useUnreadCount } from '@/api/notifications';
import { tentzu, tentzuFont } from '@/theme/tokens';

/**
 * The bell, top-right, with an unread count.
 *
 * Free tenants get every reminder here and nowhere else, so this is not
 * decoration — for an account that has not upgraded it is the only place a
 * reminder ever appears. That is why the badge is loud and the tap target is
 * generous.
 */
export function NotificationBell() {
  const unread = useUnreadCount();
  const count = unread.data ?? 0;
  const hasUnread = count > 0;
  // Three digits would burst the pill and, past a hundred, the exact number
  // stops carrying information anyway.
  const label = count > 99 ? '99+' : String(count);

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/notifications')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread ? `Notifications, ${count} unread` : 'Notifications'
      }
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tentzu.card,
        borderWidth: 1,
        borderColor: tentzu.fieldBorder,
        shadowColor: tentzu.primary,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <Ionicons
        name={hasUnread ? 'notifications' : 'notifications-outline'}
        size={21}
        color={hasUnread ? tentzu.primary : tentzu.inkVariant}
      />

      {hasUnread ? (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: label.length > 1 ? 0 : 4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 5,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tentzu.danger,
            // Rings the badge against the bell so the digit stays readable
            // wherever the icon's strokes fall behind it.
            borderWidth: 2,
            borderColor: tentzu.card,
          }}
        >
          <Text
            style={{
              fontFamily: tentzuFont.label,
              fontSize: 10,
              lineHeight: 13,
              color: '#ffffff',
            }}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
