import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Frost } from '@/components/ui/Frost';
import { CountdownRing } from './CountdownRing';
import { daysUntil, formatMoney, formatDate } from '@/lib/format';
import { tentzu, tentzuFont } from '@/theme/tokens';
import type { PaymentSchedule } from '@/lib/types';

type Props = {
  payment: PaymentSchedule | null;
  onMarkReady?: (id: number) => void;
  marking?: boolean;
  onMarkPaid?: (id: number) => void;
  paying?: boolean;
};

/**
 * The dashboard's single most important object: what is due, when, and what to
 * do about it.
 *
 * Rebuilt from a stacked column of centred text — eyebrow, big number, rule,
 * amount, date — which gave every line the same weight and read as a receipt.
 * Now the amount leads, the ring carries urgency, and the action sits on the
 * card rather than below it.
 *
 * Tone is driven by the ring's colour rather than a coloured border, so
 * urgency is legible at a glance without the whole card shouting.
 */
export function CountdownHero({ payment, onMarkReady, marking, onMarkPaid, paying }: Props) {
  if (!payment) {
    return (
      <View style={[styles.card, { alignItems: 'center', paddingVertical: 38 }]}>
        <Frost />
        <Ionicons name="checkmark-circle-outline" size={30} color={tentzu.primary} />
        <Text style={[styles.reassure, { marginTop: 10 }]}>
          Nothing due right now. I'll tell you when that changes.
        </Text>
      </View>
    );
  }

  const days = daysUntil(payment.due_date);
  const isReady = payment.status === 'ready';
  const overdue = days < 0;
  const urgent = days >= 0 && days <= 7;

  const headline = overdue
    ? "This one's late"
    : days === 0
      ? "That's today"
      : isReady
        ? "You're all set"
        : 'Next payment';

  const showReady = !isReady && payment.status === 'pending' && onMarkReady && (urgent || overdue);

  return (
    <View style={styles.card}>
      <Frost />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <CountdownRing days={days} />

        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{headline}</Text>
          <Text style={styles.amount}>{formatMoney(payment.amount, payment.currency)}</Text>
          <Text style={styles.due}>Due {formatDate(payment.due_date)}</Text>

          {isReady ? (
            <View style={styles.readyPill}>
              <Ionicons name="checkmark-circle" size={15} color={tentzu.primary} />
              <Text style={styles.readyText}>Funds ready</Text>
            </View>
          ) : null}
        </View>
      </View>

      {showReady ? (
        <Pressable
          onPress={() => onMarkReady!(payment.id)}
          disabled={marking}
          accessibilityRole="button"
          style={{ marginTop: 18, borderRadius: 22, overflow: 'hidden', opacity: marking ? 0.5 : 1 }}
        >
          <LinearGradient
            colors={['#22D3E8', '#12A9D6', '#1D7FD1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 15, alignItems: 'center' }}
          >
            <Text style={styles.cta}>{marking ? 'Saving…' : 'I have the funds ready'}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {onMarkPaid && payment.status !== 'completed' ? (
        <Pressable
          onPress={() => onMarkPaid(payment.id)}
          disabled={paying}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mark this payment as paid"
          style={{ marginTop: showReady ? 12 : 18, alignSelf: 'flex-start' }}
        >
          <Text style={styles.link}>{paying ? 'Marking…' : "I've paid this"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#0b3b45',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  eyebrow: { fontFamily: tentzuFont.label, fontSize: 13, color: tentzu.mutedInk },
  amount: {
    fontFamily: tentzuFont.headlineBold,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -1,
    color: tentzu.ink,
    marginTop: 2,
  },
  due: { fontFamily: tentzuFont.body, fontSize: 14, color: tentzu.mutedInk, marginTop: 3 },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: tentzu.tintSurface,
  },
  readyText: { fontFamily: tentzuFont.label, fontSize: 12.5, color: tentzu.primary },
  reassure: {
    fontFamily: tentzuFont.body,
    fontSize: 15,
    color: tentzu.inkVariant,
    textAlign: 'center',
    maxWidth: 250,
  },
  cta: { fontFamily: tentzuFont.headlineBold, fontSize: 16, color: '#ffffff' },
  link: { fontFamily: tentzuFont.label, fontSize: 14, color: tentzu.primary },
});
