import type { Classroom, JoinCode } from '@/api/client';

/**
 * What the invite card and screen show. `joinCode` on closed and expired is the last code the app
 * knows, shown dimmed or struck through; the API sends null once a code has expired.
 */
export type InviteState =
  | { kind: 'closed'; joinCode: JoinCode | null }
  | { kind: 'expired'; joinCode: JoinCode | null }
  | { kind: 'live'; joinCode: JoinCode };

/**
 * Expiry is also checked on the device clock, so a code that lapses while the screen is open flips
 * to "expired" without waiting for a refetch. Closed wins: turning joining on is the first fix.
 */
export function inviteState(
  classroom: Pick<Classroom, 'joiningOpen' | 'joinCode'>,
  now: number,
): InviteState {
  const code = classroom.joinCode;
  if (!classroom.joiningOpen) return { kind: 'closed', joinCode: code };
  if (!code || new Date(code.expiresAt).getTime() <= now)
    return { kind: 'expired', joinCode: code };
  return { kind: 'live', joinCode: code };
}

/** T5 regenerate copy. */
export const REGENERATE_TITLE = 'Make a new invite code?';
export const REGENERATE_MESSAGE =
  'The current code and QR will stop working. Students already in the class stay in.';
