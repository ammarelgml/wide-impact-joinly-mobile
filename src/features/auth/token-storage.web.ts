import type { User } from '@/api/client';

/**
 * Web is not a shipped target (Android is; iOS builds from the same code). This in-browser
 * stand-in for the keystore exists only so the screens can be smoke-tested in a desktop browser
 * with `npx expo start --web` and demo sign-in. It is never bundled into the Android or iOS app.
 */
const REFRESH_TOKEN_KEY = 'joinly.refreshToken';
const USER_KEY = 'joinly.user';

export const tokenStorage = {
  async read(): Promise<{ refreshToken: string; user: User } | null> {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    const userJson = sessionStorage.getItem(USER_KEY);
    if (!refreshToken || !userJson) return null;
    return { refreshToken, user: JSON.parse(userJson) as User };
  },
  async getRefreshToken(): Promise<string | null> {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },
  async save(refreshToken: string, user?: User): Promise<void> {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async saveUser(user: User): Promise<void> {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async clear(): Promise<void> {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
