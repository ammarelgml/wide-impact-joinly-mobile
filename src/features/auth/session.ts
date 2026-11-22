import { create } from 'zustand';

import { api, publicApi, setTokenSource, unwrap, type AuthSession, type User } from '@/api/client';
import { isApiError } from '@/api/errors';
import { singleFlight } from '@/lib/single-flight';

import { tokenStorage } from './token-storage';

/**
 * The one piece of client state in the app: who is signed in. Everything else is server state in
 * TanStack Query. Tokens live outside the store (access token in memory, refresh token in the
 * keystore) so they never reach React renders or dev tools.
 */
export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

type SessionState = {
  status: SessionStatus;
  user: User | null;
  /** Why the last session ended, for the welcome screen ("Please sign in again"). */
  signOutReason: 'expired' | null;
  /** A join code from a QR deep link, kept through sign-in so the student lands on the join confirm. */
  pendingJoinCode: string | null;
  /** A verified-by-Google ID token waiting for the new user to choose a role (API answered ROLE_REQUIRED). */
  pendingRoleIdToken: string | null;
};

export const useSession = create<SessionState>(() => ({
  status: 'restoring',
  user: null,
  signOutReason: null,
  pendingJoinCode: null,
  pendingRoleIdToken: null,
}));

const EXPIRY_MARGIN_MS = 30_000;
let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
const endedListeners = new Set<() => void>();

/** Runs when a session ends for any reason (sign out, or the refresh token was rejected). */
export function onSessionEnded(listener: () => void): () => void {
  endedListeners.add(listener);
  return () => endedListeners.delete(listener);
}

function setAccessToken(token: string, expiresAt: string): void {
  accessToken = token;
  accessTokenExpiresAt = new Date(expiresAt).getTime();
}

export async function startSession(session: AuthSession): Promise<void> {
  setAccessToken(session.accessToken, session.accessTokenExpiresAt);
  await tokenStorage.save(session.refreshToken, session.user);
  useSession.setState({
    status: 'signedIn',
    user: session.user,
    signOutReason: null,
    pendingRoleIdToken: null,
  });
}

export async function endSession(reason: 'expired' | null = null): Promise<void> {
  accessToken = null;
  accessTokenExpiresAt = 0;
  await tokenStorage.clear().catch(() => undefined);
  useSession.setState({
    status: 'signedOut',
    user: null,
    signOutReason: reason,
    pendingRoleIdToken: null,
  });
  endedListeners.forEach((listener) => listener());
}

/**
 * Exchanges the stored refresh token for a new pair. Single-flight: the API rotates refresh
 * tokens and treats a reused one as theft, so concurrent callers must share one request.
 * Network failures propagate (the session survives being offline); a rejected token ends it.
 */
const refreshAccessToken = singleFlight(async (): Promise<string | null> => {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    if (useSession.getState().status === 'signedIn') await endSession('expired');
    return null;
  }
  try {
    const pair = await unwrap(publicApi.POST('/v1/auth/refresh', { body: { refreshToken } }));
    setAccessToken(pair.accessToken, pair.accessTokenExpiresAt);
    await tokenStorage.save(pair.refreshToken);
    return pair.accessToken;
  } catch (error) {
    if (isApiError(error, 'REFRESH_TOKEN_INVALID', 'VALIDATION_FAILED')) {
      await endSession('expired');
      return null;
    }
    throw error;
  }
});

async function getAccessToken(): Promise<string | null> {
  if (useSession.getState().status !== 'signedIn') return null;
  if (accessToken && accessTokenExpiresAt - Date.now() > EXPIRY_MARGIN_MS) return accessToken;
  return refreshAccessToken();
}

setTokenSource({ getAccessToken, refreshAccessToken });

/**
 * Restores a saved session without a network round trip, so the app opens instantly and works
 * offline with cached data. The first API call refreshes the access token.
 */
export async function restoreSession(): Promise<void> {
  const saved = await tokenStorage.read().catch(() => null);
  useSession.setState(
    saved ? { status: 'signedIn', user: saved.user } : { status: 'signedOut', user: null },
  );
}

/**
 * After a restore, refreshes the cached profile (name and photo can change at each Google
 * sign-in) in the background. Offline is fine: the cached profile stays.
 */
export async function syncProfile(): Promise<void> {
  if (useSession.getState().status !== 'signedIn') return;
  try {
    const user = await unwrap(api.GET('/v1/me'));
    if (useSession.getState().status !== 'signedIn') return;
    useSession.setState({ user });
    await tokenStorage.saveUser(user);
  } catch {
    // Network errors keep the cached profile; a rejected session has already ended itself.
  }
}

/** Signs out this device: revokes the refresh token family on the API (best effort), then clears local state. */
export async function signOut(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const token = await getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();
    if (token && refreshToken) {
      await publicApi.POST('/v1/auth/logout', {
        body: { refreshToken },
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    }
  } catch {
    // Offline or already revoked: the local sign-out below still happens.
  } finally {
    clearTimeout(timeout);
  }
  await endSession(null);
}

export function setPendingJoinCode(code: string | null): void {
  useSession.setState({ pendingJoinCode: code });
}

/** Test hook: resets module state between tests. */
export function __resetSessionForTests(): void {
  accessToken = null;
  accessTokenExpiresAt = 0;
  endedListeners.clear();
  useSession.setState({
    status: 'restoring',
    user: null,
    signOutReason: null,
    pendingJoinCode: null,
    pendingRoleIdToken: null,
  });
}
