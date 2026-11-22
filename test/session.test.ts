import * as SecureStore from 'expo-secure-store';

import { api, unwrap } from '@/api/client';
import {
  __resetSessionForTests,
  endSession,
  onSessionEnded,
  restoreSession,
  signOut,
  startSession,
  syncProfile,
  useSession,
} from '@/features/auth/session';

import { fetchMock, jsonResponse, problem, requestAt } from './helpers';

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'amira@example.com',
  name: 'Amira Hassan',
  avatarUrl: null,
  role: 'teacher' as const,
  createdAt: '2026-11-22T19:30:00.000Z',
};

const inFuture = (ms: number) => new Date(Date.now() + ms).toISOString();

function session(accessToken = 'access-1', refreshToken = 'refresh-token-000000001') {
  return {
    accessToken,
    accessTokenExpiresAt: inFuture(15 * 60_000),
    refreshToken,
    user,
    isNewUser: false,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  store.clear();
  __resetSessionForTests();
});

it('starts a session: refresh token and profile go to secure storage, access token stays in memory', async () => {
  await startSession(session());
  expect(useSession.getState()).toMatchObject({ status: 'signedIn', user });
  expect(store.get('joinly.refreshToken')).toBe('refresh-token-000000001');
  expect([...store.values()].join()).not.toContain('access-1');
});

it('restores a saved session without a network call', async () => {
  await startSession(session());
  __resetSessionForTests();
  await restoreSession();
  expect(useSession.getState()).toMatchObject({ status: 'signedIn', user });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('restores to signed out when nothing is saved', async () => {
  await restoreSession();
  expect(useSession.getState().status).toBe('signedOut');
});

it('after a restore, refreshes once for many parallel requests, and stores the rotated token', async () => {
  await startSession(session());
  __resetSessionForTests();
  await restoreSession();

  fetchMock.mockImplementation(async (req: Request) => {
    if (req.url.endsWith('/v1/auth/refresh')) {
      return jsonResponse(200, {
        accessToken: 'access-2',
        accessTokenExpiresAt: inFuture(15 * 60_000),
        refreshToken: 'refresh-token-000000002',
      });
    }
    return jsonResponse(200, user);
  });

  await Promise.all([
    unwrap(api.GET('/v1/me')),
    unwrap(api.GET('/v1/me')),
    unwrap(api.GET('/v1/me')),
  ]);

  const refreshCalls = fetchMock.mock.calls.filter(([req]) =>
    (req as Request).url.endsWith('/refresh'),
  );
  expect(refreshCalls).toHaveLength(1);
  expect(store.get('joinly.refreshToken')).toBe('refresh-token-000000002');
  const meCalls = fetchMock.mock.calls.filter(([req]) => (req as Request).url.endsWith('/v1/me'));
  expect(
    meCalls.every(([req]) => (req as Request).headers.get('Authorization') === 'Bearer access-2'),
  ).toBe(true);
});

it('ends the session with "expired" when the refresh token is rejected, and notifies listeners', async () => {
  await startSession({ ...session(), accessTokenExpiresAt: inFuture(-1000) });
  const ended = jest.fn();
  onSessionEnded(ended);
  fetchMock.mockImplementation(async (req: Request) =>
    req.url.endsWith('/v1/auth/refresh')
      ? problem(401, 'REFRESH_TOKEN_INVALID')
      : problem(401, 'UNAUTHENTICATED'),
  );

  await expect(unwrap(api.GET('/v1/me'))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  expect(useSession.getState()).toMatchObject({
    status: 'signedOut',
    signOutReason: 'expired',
    user: null,
  });
  expect(store.size).toBe(0);
  expect(ended).toHaveBeenCalledTimes(1);
});

it('keeps the session when the refresh fails for lack of network', async () => {
  await startSession({ ...session(), accessTokenExpiresAt: inFuture(-1000) });
  fetchMock.mockRejectedValue(new TypeError('Network request failed'));
  await expect(unwrap(api.GET('/v1/me'))).rejects.toMatchObject({ code: 'NETWORK' });
  expect(useSession.getState().status).toBe('signedIn');
});

it('signs out: revokes on the API, then clears local state even if that call fails', async () => {
  await startSession(session());
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await signOut();
  const logout = requestAt(0);
  expect(logout.url).toBe('https://api.test/v1/auth/logout');
  expect(logout.headers.get('Authorization')).toBe('Bearer access-1');
  await expect(logout.json()).resolves.toEqual({ refreshToken: 'refresh-token-000000001' });
  expect(useSession.getState()).toMatchObject({ status: 'signedOut', signOutReason: null });

  await startSession(session());
  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  await signOut();
  expect(useSession.getState().status).toBe('signedOut');
  expect(store.size).toBe(0);
});

it('endSession keeps a pending join code from a deep link', async () => {
  useSession.setState({ pendingJoinCode: '246810' });
  await endSession('expired');
  expect(useSession.getState().pendingJoinCode).toBe('246810');
});

it('syncProfile refreshes the cached profile, and keeps it when offline', async () => {
  await startSession(session());
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...user, name: 'Amira H.' }));
  await syncProfile();
  expect(useSession.getState().user?.name).toBe('Amira H.');
  expect(JSON.parse(store.get('joinly.user') ?? '{}').name).toBe('Amira H.');

  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  await syncProfile();
  expect(useSession.getState()).toMatchObject({ status: 'signedIn', user: { name: 'Amira H.' } });
});
