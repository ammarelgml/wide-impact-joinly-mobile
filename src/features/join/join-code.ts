/**
 * Join codes and the QR payload. A Joinly QR encodes `joinly://join?code=482913` (backend decision
 * D6): the code only, no classroom id. Scanned data is untrusted input, so parsing is strict and
 * returns null for anything that is not exactly our scheme and host with a 6-digit code.
 */

export const JOIN_CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;
const MAX_QR_LENGTH = 200;
const JOIN_URL_PATTERN = /^joinly:\/\/join\/?\?([^#]*)$/i;

export function isJoinCode(value: unknown): value is string {
  return typeof value === 'string' && CODE_PATTERN.test(value);
}

/** Keeps the digits of typed or pasted text, e.g. "482 913" or "482-913" -> "482913". */
export function sanitizeCodeInput(text: string): string {
  return text.replace(/\D/g, '').slice(0, JOIN_CODE_LENGTH);
}

/** Returns the 6-digit code from a Joinly invite link, or null if the data is anything else. */
export function parseJoinUrl(data: string): string | null {
  if (typeof data !== 'string' || data.length > MAX_QR_LENGTH) return null;
  const match = JOIN_URL_PATTERN.exec(data.trim());
  if (!match) return null;

  const codes: string[] = [];
  for (const pair of (match[1] ?? '').split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key === 'code') codes.push(value);
  }
  // Exactly one code parameter: an ambiguous link is rejected rather than guessed.
  if (codes.length !== 1) return null;
  const code = codes[0];
  return isJoinCode(code) ? code : null;
}

export function buildJoinUrl(code: string): string {
  return `joinly://join?code=${code}`;
}
