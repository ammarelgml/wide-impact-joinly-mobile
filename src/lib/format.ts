/** "482913" -> "482 913", for reading a code aloud or from across a room. */
export function formatJoinCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/**
 * Time left until `expiresAt`: hours for a 24-hour code ("18 hours"), then minutes in the last hour.
 * Only codes that last longer than two days (the demo seed) count in days.
 */
export function formatTimeLeft(expiresAt: string, now: number = Date.now()): string | null {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return null;
  if (ms >= 2 * DAY) return plural(Math.floor(ms / DAY), 'day');
  if (ms >= HOUR) return plural(Math.floor(ms / HOUR), 'hour');
  if (ms >= MINUTE) return plural(Math.floor(ms / MINUTE), 'minute');
  return 'less than a minute';
}

/** How long ago `iso` was: "today", "yesterday", "3 days ago", then a short date ("Nov 20"). */
export function formatSince(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const days = Math.floor((startOfDay(now) - startOfDay(date.getTime())) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatStudentCount(count: number): string {
  return plural(count, 'student');
}
