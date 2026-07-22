import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Base URL resolution:
// - In dev on a device/simulator, set EXPO_PUBLIC_API_URL in .env.
// - Falls back to localhost for web / simulator.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:8000/api/v1';

const ACCESS_KEY = 'ark.access';
const REFRESH_KEY = 'ark.refresh';

// Platform-aware secure storage: SecureStore on native, localStorage on web.
const isWeb = Platform.OS === 'web';

const storage = {
  getItem: (key: string): Promise<string | null> =>
    isWeb
      ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    isWeb
      ? Promise.resolve(localStorage?.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    isWeb
      ? Promise.resolve(localStorage?.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};

export const tokenStore = {
  get: () => storage.getItem(ACCESS_KEY),
  getRefresh: () => storage.getItem(REFRESH_KEY),
  set: async (access: string, refresh?: string) => {
    await storage.setItem(ACCESS_KEY, access);
    if (refresh) await storage.setItem(REFRESH_KEY, refresh);
  },
  clear: async () => {
    await storage.removeItem(ACCESS_KEY);
    await storage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request.
api.interceptors.request.use(async (config) => {
  const token = await tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh once on 401, then retry the original request.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retried) {
      return Promise.reject(error);
    }
    original._retried = true;

    if (!refreshing) {
      refreshing = (async () => {
        const refresh = await tokenStore.getRefresh();
        if (!refresh) return null;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          await tokenStore.set(data.access);
          return data.access as string;
        } catch {
          await tokenStore.clear();
          return null;
        } finally {
          refreshing = null;
        }
      })();
    }

    const newAccess = await refreshing;
    if (!newAccess) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api(original);
  },
);

export { API_URL };
