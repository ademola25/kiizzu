import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatTimeOfDay } from '@/lib/format';
import type { ReminderChannel, ReminderLog, ReminderStatus, ReminderType } from '@/lib/types';
import { colors } from '@/theme/tokens';

type ReminderRowProps = {
  log: ReminderLog;
};

// Backend follow-up: the ReminderLog serializer currently does not expose the
// linked PaymentSchedule, so we can't show "Cheque #N · due 1 Jan" on each
// row (Story 4.5 AC bullet). Surface it here once the backend adds either a
// nested payment object or flat cheque_number / cheque_due_date fields.

type Tone = 'ok' | 'pending' | 'error';

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ink',
  pending: 'text-muted',
  error: 'text-danger',
};

const TONE_COLOR: Record<Tone, string> = {
  ok: colors.ink,
  pending: colors.muted,
  error: colors.danger,
};

const CHANNEL: Record<
  ReminderChannel,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  whatsapp: { icon: 'logo-whatsapp', label: 'WhatsApp' },
  email: { icon: 'mail', label: 'Email' },
};

const TYPE_LABEL: Record<ReminderType, string> = {
  '30d': '30 days before',
  '7d': '7 days before',
  '1d': '1 day before',
};

const STATUS: Record<
  ReminderStatus,
  { icon: keyof typeof Ionicons.glyphMap; label: string; tone: Tone }
> = {
  delivered: { icon: 'checkmark-circle', label: 'Delivered', tone: 'ok' },
  sent: { icon: 'paper-plane', label: 'Sent', tone: 'pending' },
  failed: { icon: 'close-circle', label: 'Failed', tone: 'error' },
};

const UNKNOWN_CHANNEL = { icon: 'help-circle' as const, label: 'Reminder' };
const UNKNOWN_STATUS = {
  icon: 'help-circle' as const,
  label: 'Unknown',
  tone: 'pending' as Tone,
};

/** One reminder log entry. Monochrome row; flame accent only on failure. */
export function ReminderRow({ log }: ReminderRowProps) {
  const channel = CHANNEL[log.channel] ?? UNKNOWN_CHANNEL;
  const status = STATUS[log.status] ?? UNKNOWN_STATUS;
  const timing = TYPE_LABEL[log.reminder_type] ?? log.reminder_type;

  // Show delivered_at next to "Delivered" so the timestamp reflects the right
  // event — falling back to sent_at when the delivery callback hasn't landed.
  const tsSource = log.status === 'delivered' && log.delivered_at ? log.delivered_at : log.sent_at;
  const timestamp = formatTimeOfDay(tsSource);

  const accessibilityLabel = `${channel.label}, ${timing}, ${status.label} at ${timestamp}`;

  return (
    <Card
      className="py-3 flex-row items-start gap-3"
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <View className="w-10 h-10 rounded-full bg-wash items-center justify-center">
        <Ionicons name={channel.icon} size={18} color={colors.brand} />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-ink">{channel.label}</Text>
        <Text className="text-xs text-muted mt-0.5">{timing}</Text>
        {log.status === 'failed' && log.error_message ? (
          <Text className="text-xs text-danger mt-1" numberOfLines={2}>
            {log.error_message}
          </Text>
        ) : null}
      </View>

      <View className="items-end">
        <View className="flex-row items-center gap-1">
          <Ionicons name={status.icon} size={14} color={TONE_COLOR[status.tone]} />
          <Text className={`text-xs font-semibold ${TONE_TEXT[status.tone]}`}>
            {status.label}
          </Text>
        </View>
        <Text className="text-xs text-muted mt-0.5">{timestamp}</Text>
      </View>
    </Card>
  );
}
