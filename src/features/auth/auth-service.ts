import { publicApi, unwrap, type Role } from '@/api/client';
import { isApiError } from '@/api/errors';

import { getGoogleIdToken } from './google';
import { startSession, useSession } from './session';

export type GoogleSignInOutcome = 'signedIn' | 'roleRequired' | 'cancelled';

/**
 * F1: Google proves identity once; the API then issues its own tokens. A new user gets
 * 422 ROLE_REQUIRED, so the app keeps the ID token and asks for a role before resending it.
 */
export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  const idToken = await getGoogleIdToken();
  if (!idToken) return 'cancelled';
  try {
    await startSession(await unwrap(publicApi.POST('/v1/auth/google', { body: { idToken } })));
    return 'signedIn';
  } catch (error) {
    if (isApiError(error, 'ROLE_REQUIRED')) {
      useSession.setState({ pendingRoleIdToken: idToken });
      return 'roleRequired';
    }
    throw error;
  }
}

/** Completes a first sign-in with the chosen role. The role is permanent (spec D2). */
export async function completeSignUp(role: Role): Promise<void> {
  const idToken = useSession.getState().pendingRoleIdToken;
  if (!idToken) throw new Error('No pending Google sign-in');
  await startSession(await unwrap(publicApi.POST('/v1/auth/google', { body: { idToken, role } })));
}

export function cancelSignUp(): void {
  useSession.setState({ pendingRoleIdToken: null });
}

/** Reviewer shortcut (spec D15). Only works when the API runs with DEMO_LOGIN_ENABLED=true. */
export async function signInAsDemo(account: Role): Promise<void> {
  await startSession(await unwrap(publicApi.POST('/v1/auth/demo', { body: { account } })));
}
