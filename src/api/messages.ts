import { ApiError } from './errors';

/**
 * One sentence per failure: what happened and what to do next. Screens with a more specific
 * message for a code (for example the join flow) handle that code before falling back to this.
 */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'NETWORK':
      return "Can't reach Joinly. Check your connection and try again.";
    case 'RATE_LIMITED':
      return error.retryAfterSeconds
        ? `Too many attempts. Try again in ${formatWait(error.retryAfterSeconds)}.`
        : 'Too many attempts. Wait a moment and try again.';
    case 'JOIN_CODE_INVALID':
      return "That code doesn't match any class. Check it and try again.";
    case 'JOIN_CODE_EXPIRED':
      return 'This code has expired. Ask your teacher for a new one.';
    case 'JOINING_CLOSED':
      return 'This class is not accepting new students right now. Ask your teacher to turn joining on.';
    case 'NOT_FOUND':
      return 'This is no longer available. It may have been deleted.';
    case 'FORBIDDEN_ROLE':
      return "Your account type can't do this.";
    case 'UNAUTHENTICATED':
    case 'TOKEN_EXPIRED':
    case 'REFRESH_TOKEN_INVALID':
      return 'Your session has ended. Please sign in again.';
    case 'GOOGLE_TOKEN_INVALID':
      return "Google sign-in couldn't be verified. Please try again.";
    case 'VALIDATION_FAILED':
      return (
        error.fieldErrors[0]?.message ?? 'Some details are not valid. Check them and try again.'
      );
    case 'PAYLOAD_TOO_LARGE':
      return 'That is too long. Shorten it and try again.';
    default:
      return 'Something went wrong on our side. Please try again.';
  }
}

/** 75 -> "1:15", 40 -> "40 seconds", 900 -> "15:00". */
export function formatWait(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
