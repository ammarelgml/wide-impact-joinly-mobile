import * as SecureStore from 'expo-secure-store';

import type { User } from '@/api/client';

/**
 * Persistent session data, in the OS keystore (Android Keystore / iOS Keychain), never in
 * AsyncStorage. The access token is short-lived and stays in memory only.
 */
const REFRESH_TOKEN_KEY = 'joinly.refreshToken';
const USER_KEY = 'joinly.user';

export const tokenStorage = {
  async read(): Promise<{ refreshToken: string; user: User } | null> {
    const [refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    if (!refreshToken || !userJson) return null;
    try {
      return { refreshToken, user: JSON.parse(userJson) as User };
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async save(refreshToken: string, user?: User): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async saveUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
