import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Text } from 'react-native';

import {
  getPushStatus,
  registerForPushNotifications,
  type PushRegistration,
  type PushStatus,
} from '@/lib/notifications';
import { Card } from '@/components/ui/Card';
import { PillButton } from '@/components/ui/PillButton';

type CardState =
  | { kind: 'loading' }
  | { kind: 'granted' }
  | { kind: 'granted-no-token'; reason: string }
  | { kind: 'denied'; canAskAgain: boolean }
  | { kind: 'undetermined' }
  | { kind: 'unsupported' };

/**
 * Settings card showing the user's current push state and offering a single
 * Enable affordance. Honest disclosure: we capture the Expo push token but
 * don't sync it to the backend yet — the device-token endpoint isn't shipped,
 * and the backend reminder task doesn't dispatch Expo push either.
 */
export function PushCard() {
  const [state, setState] = useState<CardState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);

  // Re-check on mount AND every time the app foregrounds — covers the case
  // where the user fixes a denied permission via system Settings and comes
  // back to the app.
  const refresh = useCallback(async () => {
    const status: PushStatus = await getPushStatus();
    setState(toCardState(status));
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result: PushRegistration = await registerForPushNotifications();
      setState(registrationToCardState(result));
      if (result.status === 'error') Alert.alert('Push not available', result.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Text className="text-xs uppercase tracking-widest text-muted">Push notifications</Text>
      {renderBody(state, busy, enable)}
    </Card>
  );
}

function renderBody(state: CardState, busy: boolean, enable: () => void) {
  switch (state.kind) {
    case 'loading':
      return <Text className="text-sm text-muted mt-2">Checking…</Text>;

    case 'granted':
      return (
        <>
          <Text className="text-base font-semibold text-ink mt-2">Permission granted</Text>
          <Text className="text-xs text-muted mt-1">
            We'll send a banner the moment push delivery is wired on the server side.
          </Text>
        </>
      );

    case 'granted-no-token':
      return (
        <>
          <Text className="text-base font-semibold text-ink mt-2">Almost there</Text>
          <Text className="text-xs text-muted mt-1">
            Permission's granted, but we couldn't fetch a delivery token. {state.reason}
          </Text>
        </>
      );

    case 'denied':
      return (
        <>
          <Text className="text-base font-semibold text-ink mt-2">Blocked in system settings</Text>
          <Text className="text-xs text-muted mt-1 mb-3">
            {state.canAskAgain
              ? 'Tap below and accept the prompt to turn them back on.'
              : 'Open Settings to allow notifications for Ark.'}
          </Text>
          {state.canAskAgain ? (
            <PillButton
              label={busy ? 'Asking…' : 'Try again'}
              variant="secondary"
              loading={busy}
              disabled={busy}
              onPress={enable}
            />
          ) : (
            <PillButton
              label="Open system settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          )}
        </>
      );

    case 'unsupported':
      return (
        <>
          <Text className="text-base font-semibold text-ink mt-2">Not available here</Text>
          <Text className="text-xs text-muted mt-1">
            Push needs a real device — it doesn't work on simulators or in Expo Go.
          </Text>
        </>
      );

    case 'undetermined':
      return (
        <>
          <Text className="text-base font-semibold text-ink mt-2">Not enabled</Text>
          <Text className="text-xs text-muted mt-1 mb-3">
            Once push delivery is live on the server, you'll get a banner for each cheque.
          </Text>
          <PillButton
            label={busy ? 'Asking permission…' : 'Enable push notifications'}
            loading={busy}
            disabled={busy}
            onPress={enable}
          />
        </>
      );

    default:
      // Exhaustiveness — a new variant on CardState will fail to compile here.
      return assertNever(state);
  }
}

function toCardState(status: PushStatus): CardState {
  switch (status.status) {
    case 'granted':
      return { kind: 'granted' };
    case 'denied':
      return { kind: 'denied', canAskAgain: status.canAskAgain };
    case 'undetermined':
      return { kind: 'undetermined' };
    case 'unsupported':
      return { kind: 'unsupported' };
    default:
      return assertNever(status);
  }
}

function registrationToCardState(result: PushRegistration): CardState {
  switch (result.status) {
    case 'granted':
      return { kind: 'granted' };
    case 'granted-no-token':
      return { kind: 'granted-no-token', reason: result.reason };
    case 'denied':
      return { kind: 'denied', canAskAgain: result.canAskAgain };
    case 'undetermined':
      return { kind: 'undetermined' };
    case 'unsupported':
      return { kind: 'unsupported' };
    case 'error':
      // We surface the message via Alert at the call site; render the
      // already-tried state as "undetermined" so the user can retry.
      return { kind: 'undetermined' };
    default:
      return assertNever(result);
  }
}

function assertNever(_value: never): never {
  throw new Error('Unreachable: PushCard reached an unhandled state.');
}
