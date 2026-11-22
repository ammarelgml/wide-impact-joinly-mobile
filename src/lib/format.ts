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

/** Time left until `expiresAt`, e.g. "18 hours", "45 minutes", "less than a minute". */
export function formatTimeLeft(expiresAt: string, now: number = Date.now()): string | null {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return null;
  if (ms >= DAY) return plural(Math.floor(ms / DAY), 'day');
  if (ms >= HOUR) return plural(Math.floor(ms / HOUR), 'hour');
  if (ms >= MINUTE) return plural(Math.floor(ms / MINUTE), 'minute');
  return 'less than a minute';
}

/** How long ago `iso` was, e.g. "today", "yesterday", "3 days ago", or a date after a month. */
export function formatSince(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const days = Math.floor((startOfDay(now) - startOfDay(date.getTime())) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `on ${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatStudentCount(count: number): string {
  return plural(count, 'student');
}
