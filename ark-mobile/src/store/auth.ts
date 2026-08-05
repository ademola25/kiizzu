import { create } from 'zustand';
import { api, tokenStore } from '@/lib/api';
import { queryClient } from '@/lib/query';

type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  email_verified: boolean;
  onboarding_complete: boolean;
  whatsapp_opted_in: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type ProfileUpdate = Partial<Pick<User, 'name' | 'phone'>> & {
  whatsapp_opted_in?: boolean;
};

type AuthState = {
  user: User | null;
  status: 'loading' | 'signedIn' | 'signedOut';
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
    set({ user: me.data, status: 'signedIn' });
  },

  register: async (input) => {
    const { data } = await api.post('/auth/register/', input);
    await tokenStore.set(data.access, data.refresh);
    const me = await api.get<User>('/auth/me/');
    set({ user: me.data, status: 'signedIn' });
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
    set({ user: null, status: 'signedOut' });
  },

  logout: async () => {
    await tokenStore.clear();
    queryClient.clear();
    set({ user: null, status: 'signedOut' });
  },
}));
