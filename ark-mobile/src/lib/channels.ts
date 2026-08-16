import type { Ionicons } from '@expo/vector-icons';

import type { ReminderChannel } from '@/lib/types';

/**
 * The four reminder channels, described once.
 *
 * Onboarding and Settings both render this list. When they each had their own
 * copy the two drifted — Settings offered WhatsApp that onboarding never
 * mentioned — so the wording, the icons and the free/paid split all live here.
 *
 * `free` mirrors the server's rule (see reminders/services/channels.py). It is
 * used for presentation only; the server still decides what may be enabled and
 * rejects anything else, so a stale client cannot grant itself a paid channel.
 */
export type ChannelSpec = {
  key: ReminderChannel;
  /** The `notify_*` field on the user / onboarding draft. */
  field: 'notify_in_app' | 'notify_email' | 'notify_sms' | 'notify_whatsapp';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  free: boolean;
};

export const CHANNELS: ChannelSpec[] = [
  {
    key: 'in_app',
    field: 'notify_in_app',
    title: 'In-app',
    subtitle: "I'll put it in your bell, up in the corner. Free, always.",
    icon: 'notifications',
    free: true,
  },
  {
    key: 'email',
    field: 'notify_email',
    title: 'Email',
    subtitle: "I'll email the address you sign up with.",
    icon: 'mail',
    free: false,
  },
  {
    key: 'sms',
    field: 'notify_sms',
    title: 'SMS',
    subtitle: 'A text to your phone, even with no data.',
    icon: 'chatbubble-ellipses',
    free: false,
  },
  {
    key: 'whatsapp',
    field: 'notify_whatsapp',
    title: 'WhatsApp',
    subtitle: "I'll message you on WhatsApp.",
    icon: 'logo-whatsapp',
    free: false,
  },
];
