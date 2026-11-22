import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { config } from '@/lib/config';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  // The ID token's audience is the Web client ID; the API verifies it against the same value.
  GoogleSignin.configure({
    webClientId: config.googleWebClientId,
    scopes: ['openid', 'email', 'profile'],
  });
  configured = true;
}

export class GoogleSignInError extends Error {
  constructor(
    message: string,
    readonly reason: 'play-services' | 'in-progress' | 'no-id-token' | 'failed',
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'GoogleSignInError';
  }
}

/**
 * Opens the native Google account picker and returns an ID token, or null if the user cancelled.
 * Cancelling is not an error: the welcome screen simply returns to idle.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Always show the account picker, so a shared phone can switch accounts.
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return null;
    const idToken = response.data.idToken;
    if (!idToken) throw new GoogleSignInError('Google did not return an ID token', 'no-id-token');
    return idToken;
  } catch (error) {
    if (error instanceof GoogleSignInError) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new GoogleSignInError('Sign-in already in progress', 'in-progress', { cause: error });
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleSignInError('Google Play services are not available', 'play-services', {
          cause: error,
        });
      }
    }
    throw new GoogleSignInError('Google sign-in failed', 'failed', { cause: error });
  }
}

export async function signOutOfGoogle(): Promise<void> {
  ensureConfigured();
  await GoogleSignin.signOut().catch(() => undefined);
}
