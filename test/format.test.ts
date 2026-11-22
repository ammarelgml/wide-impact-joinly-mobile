import { inviteState } from '@/features/classrooms/join-code-status';
import { formatJoinCode, formatSince, formatStudentCount, formatTimeLeft } from '@/lib/format';

const NOW = new Date('2026-11-23T10:00:00Z').getTime();
const HOUR = 3_600_000;

describe('format', () => {
  it('spaces a code for reading aloud', () => {
    expect(formatJoinCode('482913')).toBe('482 913');
  });

  it('describes time left on a code', () => {
    expect(formatTimeLeft(new Date(NOW + 18.5 * HOUR).toISOString(), NOW)).toBe('18 hours');
    expect(formatTimeLeft(new Date(NOW + HOUR).toISOString(), NOW)).toBe('1 hour');
    expect(formatTimeLeft(new Date(NOW + 45 * 60_000).toISOString(), NOW)).toBe('45 minutes');
    expect(formatTimeLeft(new Date(NOW + 30 * 24 * HOUR).toISOString(), NOW)).toBe('30 days');
    expect(formatTimeLeft(new Date(NOW - 1).toISOString(), NOW)).toBeNull();
  });

  it('describes how long ago someone joined', () => {
    expect(formatSince(new Date(NOW).toISOString(), NOW)).toBe('today');
    expect(formatSince(new Date(NOW - 24 * HOUR).toISOString(), NOW)).toBe('yesterday');
    expect(formatSince(new Date(NOW - 3 * 24 * HOUR).toISOString(), NOW)).toBe('3 days ago');
  });

  it('pluralises student counts', () => {
    expect(formatStudentCount(1)).toBe('1 student');
    expect(formatStudentCount(0)).toBe('0 students');
  });
});

describe('inviteState', () => {
  const joinCode = {
    code: '482913',
    joinUrl: 'joinly://join?code=482913',
    createdAt: new Date(NOW - HOUR).toISOString(),
    expiresAt: new Date(NOW + HOUR).toISOString(),
  };

  it('is live with an open class and an unexpired code', () => {
    expect(inviteState({ joiningOpen: true, joinCode }, NOW)).toEqual({ kind: 'live', joinCode });
  });

  it('is closed whenever joining is off, even with a live code', () => {
    expect(inviteState({ joiningOpen: false, joinCode }, NOW).kind).toBe('closed');
  });

  it('is expired when the API has no live code, or the code lapsed on the device clock', () => {
    expect(inviteState({ joiningOpen: true, joinCode: null }, NOW).kind).toBe('expired');
    expect(inviteState({ joiningOpen: true, joinCode }, NOW + 2 * HOUR).kind).toBe('expired');
  });
});
