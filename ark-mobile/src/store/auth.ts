import { create } from 'zustand';
import type { NotificationPlan } from '@/lib/types';
import { api, tokenStore } from '@/lib/api';
import { useOnboarding } from '@/store/onboarding';
import { queryClient } from '@/lib/query';

type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  email_verified: boolean;
  onboarding_complete: boolean;
  /** Reminder channels. In-app is free; email/SMS/WhatsApp need a paid plan. */
  notify_in_app: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_whatsapp: boolean;
  /** Server's ruling on what this plan may enable. */
  notification_plan: NotificationPlan;
  /** Legacy alias the backend still stores WhatsApp consent under. */
  whatsapp_opted_in: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type ProfileUpdate = Partial<Pick<User, 'name' | 'phone'>> & {
  notify_in_app?: boolean;
  notify_email?: boolean;
  notify_sms?: boolean;
  notify_whatsapp?: boolean;
  /** IANA zone from the device — reminder windows are computed in it. */
  timezone?: string;
};

export type SignedOutReason = 'logout' | 'deleted' | null;

type AuthState = {
  user: User | null;
  status: 'loading' | 'signedIn' | 'signedOut';
  /**
   * Why the session ended. The entry gate needs this: a fresh install belongs
   * in onboarding, someone who just logged out belongs on the login screen, and
   * someone who deleted their account belongs back at the very start. Without
   * it, every signed-out user was funnelled into the survey — which is why
   * logging out looked like it had failed.
   */
  signedOutReason: SignedOutReason;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<string | undefined>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<string | undefined>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  signedOutReason: null,

  // Called on app start: if a token exists, load the profile.
  bootstrap: async () => {
    const token = await tokenStore.get();
    if (!token) return set({ status: 'signedOut' });
    try {
      const { data } = await api.get<User>('/auth/me/');
      set({ user: data, status: 'signedIn' });
    } catch {
      await tokenStore.clear();
      set({ user: null, status: 'signedOut' });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    await tokenStore.set(data.access, data.refresh);
    const me = await api.get<User>('/auth/me/');
    set({ user: me.data, status: 'signedIn', signedOutReason: null });
  },

  register: async (input) => {
    const { data } = await api.post('/auth/register/', input);
    await tokenStore.set(data.access, data.refresh);
    const me = await api.get<User>('/auth/me/');
    set({ user: me.data, status: 'signedIn', signedOutReason: null });
    // `dev_code` is only present when the backend runs with DEBUG on — lets the
    // verify screen show the code without checking a mail inbox during testing.
    return data.dev_code as string | undefined;
  },

  verifyEmail: async (code) => {
    const { data } = await api.post<User>('/auth/email/verify/', { code });
    set({ user: data });
  },

  resendVerification: async () => {
    const { data } = await api.post<{ dev_code?: string }>('/auth/email/verify/resend/', {});
    return data.dev_code;
  },

  refreshUser: async () => {
    const { data } = await api.get<User>('/auth/me/');
    set({ user: data });
  },

  updateProfile: async (patch) => {
    // PATCH (not PUT) — DRF's RetrieveUpdateAPIView treats PUT as a full
    // representation and would 400 on a partial body like the WhatsApp toggle.
    const { data } = await api.patch<User>('/auth/me/', patch);
    set({ user: data });
  },

  deleteAccount: async () => {
    await api.delete('/auth/me/delete/');
    await tokenStore.clear();
    // Drop every cached query so the next user on this device can't see
    // documents/payments/reminders from the deleted account.
    queryClient.clear();
    // Same reason as logout: the survey draft is in-memory and would otherwise
    // survive the account it belonged to.
    useOnboarding.getState().reset();
    set({ user: null, status: 'signedOut', signedOutReason: 'deleted' });
  },

  logout: async () => {
    await tokenStore.clear();
    queryClient.clear();
    // Clear the survey draft too. It is plain in-memory state that outlives a
    // logout, so without this the next person to open the app sees the previous
    // user's address, rent and lease dates already filled in — and, because the
    // entry gate sends signed-out users into onboarding, they see it
    // immediately. A logout must not leave one user's data on another's screen.
    useOnboarding.getState().reset();
    set({ user: null, status: 'signedOut', signedOutReason: 'logout' });
  },
}));
