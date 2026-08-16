import type { ReactNode } from 'react';
import { Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TentzuScreen } from '@/components/onboarding/TentzuScreen';
import { MascotHero } from '@/components/onboarding/MascotHero';
import { mascotAssistant } from '@/components/onboarding/mascots';
import { useOnboarding } from '@/store/onboarding';
import { tentzu, tentzuFont } from '@/theme/tokens';

// Step 5/7 — reminder channels. Email is always on (free tier); WhatsApp is the
// one real preference the backend stores (User.whatsapp_opted_in).
export default function RemindersStep() {
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);

  return (
    <TentzuScreen
      step={5}
      total={7}
      illustration={<MascotHero source={mascotAssistant} height={200} />}
      title="What should I watch for you?"
      subtitle="Pick where I should reach you. I'll nudge you 30, 7 and 1 day before every payment so you never worry again."
      primaryLabel="Set my reminders"
      primaryIcon="arrow-forward"
      onPrimary={() => router.push('/(onboarding)/plan')}
    >
      <View style={{ gap: 12 }}>
        <ChannelCard
          icon="mail"
          title="Email"
          subtitle="Always on — I'll email the address you sign up with."
          right={<LockedOn />}
        />
        <ChannelCard
          icon="logo-whatsapp"
          title="WhatsApp"
          subtitle="I'll message you on WhatsApp too. Recommended."
          right={
            <Switch
              value={draft.whatsapp_opted_in}
              onValueChange={(v) => set('whatsapp_opted_in', v)}
              trackColor={{ false: tentzu.track, true: tentzu.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor={tentzu.track}
            />
          }
        />
      </View>
    </TentzuScreen>
  );
}

function ChannelCard({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  right: ReactNode;
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

function LockedOn() {
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
      <Ionicons name="checkmark-circle" size={15} color={tentzu.primary} />
      <Text style={{ fontFamily: tentzuFont.label, fontSize: 12, color: tentzu.primary }}>On</Text>
    </View>
  );
}
