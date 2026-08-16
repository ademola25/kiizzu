import { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { CHANNELS, type ChannelSpec } from '@/lib/channels';
import { errorMessage } from '@/lib/errors';
import { useAuth, type ProfileUpdate } from '@/store/auth';
import { tentzu, tentzuFont } from '@/theme/tokens';

type Props = {
  /** Opens the upgrade sheet when a locked channel is switched on. */
  onUpgrade: () => void;
};

/**
 * The four reminder channels, with plan gating.
 *
 * Entitlement is read from `user.notification_plan.allowed` — the server's own
 * ruling — rather than re-derived from the subscription tier here. One place
 * decides what a plan includes; this screen only renders the answer. The server
 * still rejects anything it disagrees with, so a stale client cannot enable a
 * paid channel by being out of date.
 */
export function ChannelsCard({ onUpgrade }: Props) {
  const user = useAuth((s) => s.user);
  const allowed = user?.notification_plan?.allowed ?? ['in_app'];

  return (
    <Card>
      <Text className="text-xs uppercase tracking-widest text-muted mb-2">Reminders</Text>
      <View style={{ gap: 4 }}>
        {CHANNELS.map((channel) => (
          <ChannelToggle
            key={channel.key}
            channel={channel}
            locked={!allowed.includes(channel.key)}
            onUpgrade={onUpgrade}
          />
        ))}
      </View>
      <Text className="text-xs text-muted mt-3">
        In-app notifications are free. Email, SMS and WhatsApp come with a paid plan.
      </Text>
    </Card>
  );
}

function ChannelToggle({
  channel,
  locked,
  onUpgrade,
}: {
  channel: ChannelSpec;
  locked: boolean;
  onUpgrade: () => void;
}) {
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);
  const serverValue = !!user?.[channel.field];

  // Optimistic mirror so the switch moves on tap; the controlled value would
  // otherwise sit still until the PATCH round-trips.
  const [value, setValue] = useState(serverValue);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) setValue(serverValue);
  }, [serverValue, busy]);

  const onToggle = async (next: boolean) => {
    if (busy) return;

    // Intercept only *turning on*. Switching a channel off must always work,
    // including for someone who has just lapsed and still has it enabled.
    if (next && locked) {
      // The native Switch animates its thumb before onValueChange returns;
      // pinning the value back stops it flashing "on" before the sheet opens.
      setValue(false);
      onUpgrade();
      return;
    }

    const prev = value;
    setValue(next);
    setBusy(true);
    try {
      await updateProfile({ [channel.field]: next } as ProfileUpdate);
    } catch (err) {
      setValue(prev);
      Alert.alert("Couldn't update preference", errorMessage(err, 'Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
      }}
    >
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
        <Ionicons name={channel.icon} size={18} color={tentzu.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: tentzuFont.label, fontSize: 15, color: tentzu.ink }}>
            {channel.title}
          </Text>
          {locked ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: tentzu.tintSurface,
                borderRadius: 999,
                paddingVertical: 2,
                paddingHorizontal: 7,
              }}
            >
              <Ionicons name="lock-closed" size={10} color={tentzu.primary} />
              <Text style={{ fontFamily: tentzuFont.label, fontSize: 10, color: tentzu.primary }}>
                Paid
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{ fontFamily: tentzuFont.body, fontSize: 12, color: tentzu.mutedInk, marginTop: 1 }}
        >
          {channel.subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={busy}
        trackColor={{ false: tentzu.track, true: tentzu.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={tentzu.track}
        accessibilityLabel={`${channel.title} reminders`}
      />
    </View>
  );
}
