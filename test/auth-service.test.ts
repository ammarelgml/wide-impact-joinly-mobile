import { completeSignUp, signInAsDemo, signInWithGoogle } from '@/features/auth/auth-service';
import { getGoogleIdToken } from '@/features/auth/google';
import { __resetSessionForTests, useSession } from '@/features/auth/session';

import { fetchMock, jsonResponse, problem, requestAt } from './helpers';

jest.mock('@/features/auth/google', () => ({
  getGoogleIdToken: jest.fn(),
  signOutOfGoogle: jest.fn(),
  GoogleSignInError: class GoogleSignInError extends Error {},
}));
const googleToken = getGoogleIdToken as jest.Mock;

const authSession = (role: 'teacher' | 'student') => ({
  accessToken: 'access',
  accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString(),
  refreshToken: 'refresh-token-000000001',
  isNewUser: true,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'omar@example.com',
    name: 'Omar Khaled',
    avatarUrl: null,
    role,
    createdAt: '2026-11-22T19:30:00.000Z',
  },
});

beforeEach(() => {
  fetchMock.mockReset();
  googleToken.mockReset();
  __resetSessionForTests();
  useSession.setState({ status: 'signedOut' });
});

it('returns "cancelled" without calling the API when the user closes the Google picker', async () => {
  googleToken.mockResolvedValue(null);
  await expect(signInWithGoogle()).resolves.toBe('cancelled');
  expect(fetchMock).not.toHaveBeenCalled();
});

it('signs a returning user straight in', async () => {
  googleToken.mockResolvedValue('google-id-token');
  fetchMock.mockResolvedValue(jsonResponse(200, authSession('teacher')));
  await expect(signInWithGoogle()).resolves.toBe('signedIn');
  expect(useSession.getState().user?.role).toBe('teacher');
});

it('asks a new user for a role, then resends the same ID token with it', async () => {
  googleToken.mockResolvedValue('google-id-token');
  fetchMock.mockResolvedValueOnce(problem(422, 'ROLE_REQUIRED'));
  await expect(signInWithGoogle()).resolves.toBe('roleRequired');
  expect(useSession.getState()).toMatchObject({
    status: 'signedOut',
    pendingRoleIdToken: 'google-id-token',
  });

  fetchMock.mockResolvedValueOnce(jsonResponse(200, authSession('student')));
  await completeSignUp('student');
  await expect(requestAt(1).json()).resolves.toEqual({
    idToken: 'google-id-token',
    role: 'student',
  });
  expect(useSession.getState()).toMatchObject({ status: 'signedIn', pendingRoleIdToken: null });
});

it('surfaces API failures as typed errors', async () => {
  googleToken.mockResolvedValue('google-id-token');
  fetchMock.mockResolvedValue(problem(401, 'GOOGLE_TOKEN_INVALID'));
  await expect(signInWithGoogle()).rejects.toMatchObject({ code: 'GOOGLE_TOKEN_INVALID' });
  expect(useSession.getState().status).toBe('signedOut');
});

it('signs in to a demo account', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, authSession('student')));
  await signInAsDemo('student');
  await expect(requestAt(0).json()).resolves.toEqual({ account: 'student' });
  expect(useSession.getState().status).toBe('signedIn');
});
