import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * One-shot init that must run at app start, before any push could arrive:
 *   1. Set the foreground handler so banners actually show while open.
 *   2. Register the Android `default` channel at HIGH importance up front —
 *      if a push arrives on Android with no matching channel, the system
 *      silently drops it into a low-importance default, and the user never
 *      sees the heads-up display.
 *
 * Idempotent on the runtime side (setNotificationHandler / setNotificationChannelAsync
 * are last-writer-wins), but we still only need it once per process.
 */
export function initPushNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // Fire-and-forget — failure here only affects channel importance, and
    // we don't have a useful surface to bubble it to during boot.
    void Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export type PushStatus =
  | { status: 'granted'; canAskAgain: boolean }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'undetermined'; canAskAgain: boolean }
  | { status: 'unsupported' }; // simulator / web — OS won't issue a token

/** Read current permission state without prompting. */
export async function getPushStatus(): Promise<PushStatus> {
  if (!Device.isDevice) return { status: 'unsupported' };
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { status: status as 'granted' | 'denied' | 'undetermined', canAskAgain };
}

export type PushRegistration =
  | { status: 'granted'; token: string }
  | { status: 'granted-no-token'; reason: string } // permission OK but token fetch failed
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'undetermined' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

/**
 * Asks for notification permission and fetches the Expo push token. Returns
 * a discriminated result so the UI can render an honest state for each
 * outcome — see PushCard for the consumer.
 *
 * The captured token has nowhere to sync yet (no backend /push/register
 * endpoint), so this function deliberately does not POST anywhere. Surface
 * the captured-but-not-synced state in the UI and document the gap.
 */
export async function registerForPushNotifications(): Promise<PushRegistration> {
  if (!Device.isDevice) return { status: 'unsupported' };

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  let canAskAgain = existing.canAskAgain;

  if (status !== 'granted') {
    const next = await Notifications.requestPermissionsAsync();
    status = next.status;
    canAskAgain = next.canAskAgain;
  }

  if (status === 'denied') return { status: 'denied', canAskAgain };
  if (status === 'undetermined') return { status: 'undetermined' };

  const projectId = (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)
    ?.projectId;

  if (!projectId) {
    return {
      status: 'granted-no-token',
      reason:
        "Permission granted, but this build isn't linked to an EAS project " +
        '— run `eas init` and rebuild.',
    };
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return { status: 'granted', token: result.data };
  } catch (e) {
    // Provisional grant / network / APNs config issues all land here on
    // iOS; surface the underlying reason rather than a generic "error".
    return {
      status: 'granted-no-token',
      reason: e instanceof Error ? e.message : 'Could not fetch a push token.',
    };
  }
}
