import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { formatTimeOfDay } from '@/lib/format';
import type { ReminderLog } from '@/lib/types';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  log: ReminderLog;
  onPress: () => void;
};

/**
 * One in-app notification.
 *
 * Unread is carried by a dot and by weight, not by colour alone — a
 * colour-only distinction disappears for anyone who cannot separate the two
 * hues, and "which of these have I already dealt with?" is the entire job of
 * this screen.
 */
export function NotificationRow({ log, onPress }: Props) {
  const unread = !log.is_read;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${log.title}. ${unread ? 'Unread' : 'Read'}.`}
    >
      <Card>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tentzu.tintSurface,
            }}
          >
            <Ionicons name="notifications" size={18} color={tentzu.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: unread ? tentzuFont.label : tentzuFont.body,
                  fontSize: 15,
                  color: tentzu.ink,
                }}
              >
                {/* Older rows predate stored copy; fall back rather than
                    render an empty card. */}
                {log.title || 'Rent reminder'}
              </Text>
              {unread ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: tentzu.primary,
                  }}
                />
              ) : null}
            </View>

            {log.body ? (
              <Text
                style={{
                  fontFamily: tentzuFont.body,
                  fontSize: 13,
                  color: tentzu.mutedInk,
                  marginTop: 3,
                }}
              >
                {log.body}
              </Text>
            ) : null}

            <Text
              style={{
                fontFamily: tentzuFont.body,
                fontSize: 11,
                color: tentzu.mutedInk,
                marginTop: 6,
              }}
            >
              {formatTimeOfDay(log.sent_at)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
