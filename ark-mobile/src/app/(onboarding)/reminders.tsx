import type { ReactNode } from 'react';
import { Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { MascotHero } from '@/components/onboarding/MascotHero';
import { mascotAssistant } from '@/components/onboarding/mascots';
import { CHANNELS } from '@/lib/channels';
import { useOnboarding } from '@/store/onboarding';
import { tentzu, tentzuFont } from '@/theme/tokens';

/**
 * Step 7/14 — where should Tentzu reach you.
 *
 * Four channels. In-app is free and switchable; the other three need a paid
 * plan and are shown *locked* rather than togglable. That is deliberate: a new
 * account is always on the free plan, so an enabled paid toggle here would be
 * a promise the next screen breaks — and sending it to the server would fail
 * account creation outright. Naming the price up front costs nothing.
 */
export default function RemindersStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);

  return (
    <TentzuScreen
      step={7}
      total={14}
      // Smaller than the other steps on purpose: with four channels to
      // compare, the list is the content here and a 200pt mascot pushed three
      // of them below the fold.
      illustration={<MascotHero source={mascotAssistant} height={120} />}
      title="What should I watch for you?"
      subtitle="I'll nudge you 30, 7 and 1 day before every payment. In-app is free and always there — the rest come with a paid plan."
      primaryLabel="Set my reminders"
      primaryIcon="arrow-forward"
      onPrimary={() => router.push('/(onboarding)/contacts')}
    >
      <View style={{ gap: 12 }}>
        {CHANNELS.map((channel) => (
          <ChannelCard
            key={channel.key}
            icon={channel.icon}
            title={channel.title}
            subtitle={channel.subtitle}
            dimmed={!channel.free}
            right={
              channel.free ? (
                <Switch
                  value={draft[channel.field]}
                  onValueChange={(v) => set(channel.field, v)}
                  trackColor={{ false: tentzu.track, true: tentzu.primary }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={tentzu.track}
                />
              ) : (
                <PaidPill />
              )
            }
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: tentzu.tintSurface,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginTop: 14,
        }}
      >
        <Ionicons name="information-circle-outline" size={18} color={tentzu.primary} />
        <Text style={{ flex: 1, fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.inkVariant }}>
          Switch on email, SMS and WhatsApp any time from Settings once you upgrade.
        </Text>
      </View>
    </TentzuScreen>
  );
}

function ChannelCard({
  icon,
  title,
  subtitle,
  right,
  dimmed = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  right: ReactNode;
  dimmed?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: tentzu.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tentzu.fieldBorder,
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: tentzu.primary,
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
        // Locked channels stay legible — they are the upsell, so they must be
        // readable — but visibly not-yours-yet.
        opacity: dimmed ? 0.62 : 1,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tentzu.tintSurface,
        }}
      >
        <Ionicons name={icon} size={21} color={tentzu.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: tentzuFont.label, fontSize: 16, color: tentzu.ink }}>{title}</Text>
        <Text style={{ fontFamily: tentzuFont.body, fontSize: 13, color: tentzu.mutedInk, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      {right}
    </View>
  );
}

function PaidPill() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: tentzu.tintSurface,
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 11,
      }}
    >
      <Ionicons name="lock-closed" size={13} color={tentzu.primary} />
      <Text style={{ fontFamily: tentzuFont.label, fontSize: 12, color: tentzu.primary }}>Paid</Text>
    </View>
  );
}
