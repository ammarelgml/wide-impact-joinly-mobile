import { config } from '@/lib/config';

/**
 * Join codes and the QR payload. A Joinly QR encodes `https://<api host>/join?code=482913`: the code
 * only, no classroom id. Phones with the app open it through Android App Links; others get the
 * API's small web page with the code and a download link. Older QRs carry `joinly://join?code=…`,
 * which still works. Scanned data is untrusted input, so parsing is strict and returns null for
 * anything that is not exactly one of those two forms, on our own API host, with a 6-digit code.
 */

export const JOIN_CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;
const MAX_QR_LENGTH = 200;
const APP_LINK_PATTERN = /^joinly:\/\/join\/?\?([^#]*)$/i;
const WEB_LINK_PATTERN = /^https:\/\/([^/?#]+)\/join\/?\?([^#]*)$/i;

/** The host the API serves invite pages from, e.g. `wide-impact-joinly-backend-production.up.railway.app`. */
function apiHost(): string {
  return (/^https?:\/\/([^/?#]+)/i.exec(config.apiUrl)?.[1] ?? '').toLowerCase();
}

export function isJoinCode(value: unknown): value is string {
  return typeof value === 'string' && CODE_PATTERN.test(value);
}

/** Keeps the digits of typed or pasted text, e.g. "482 913" or "482-913" -> "482913". */
export function sanitizeCodeInput(text: string): string {
  return text.replace(/\D/g, '').slice(0, JOIN_CODE_LENGTH);
}

/** Returns the 6-digit code from a Joinly invite link, or null if the data is anything else. */
export function parseJoinUrl(data: string, trustedHost: string = apiHost()): string | null {
  if (typeof data !== 'string' || data.length > MAX_QR_LENGTH) return null;
  const text = data.trim();
  let query: string | undefined;
  const app = APP_LINK_PATTERN.exec(text);
  if (app) {
    query = app[1];
  } else {
    const web = WEB_LINK_PATTERN.exec(text);
    // Only our own API host: a lookalike page must not be able to hand the app a code.
    if (!web || web[1]?.toLowerCase() !== trustedHost.toLowerCase()) return null;
    query = web[2];
  }

  const codes: string[] = [];
  for (const pair of (query ?? '').split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key === 'code') codes.push(value);
  }
  // Exactly one code parameter: an ambiguous link is rejected rather than guessed.
  if (codes.length !== 1) return null;
  const code = codes[0];
  return isJoinCode(code) ? code : null;
}

/** The invite link for a code, in the form the API puts in QR codes. */
export function buildJoinUrl(code: string): string {
  return `${config.apiUrl}/join?code=${code}`;
}
