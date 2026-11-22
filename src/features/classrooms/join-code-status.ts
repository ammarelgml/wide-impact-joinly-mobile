import type { Classroom, JoinCode } from '@/api/client';

export type InviteState =
  { kind: 'closed' } | { kind: 'expired' } | { kind: 'live'; joinCode: JoinCode };

/**
 * What the invite card and screen should show. Expiry is also checked on the device clock, so a
 * code that lapses while the screen is open flips to "expired" without waiting for a refetch.
 */
export function inviteState(
  classroom: Pick<Classroom, 'joiningOpen' | 'joinCode'>,
  now: number,
): InviteState {
  if (!classroom.joiningOpen) return { kind: 'closed' };
  const code = classroom.joinCode;
  if (!code || new Date(code.expiresAt).getTime() <= now) return { kind: 'expired' };
  return { kind: 'live', joinCode: code };
}

export const REGENERATE_MESSAGE =
  'The current code and QR will stop working. Students already in the class stay in it.';
