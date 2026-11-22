import { isProblem } from './errors';

export type TokenSource = {
  /** A usable access token (refreshing first if the current one is about to expire), or null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** Forces a refresh after the API rejected a token. Shared by concurrent callers. Null when the session ended. */
  refreshAccessToken: () => Promise<string | null>;
};

const RETRYABLE_AUTH_CODES = new Set(['TOKEN_EXPIRED', 'UNAUTHENTICATED']);

/**
 * A fetch that authenticates requests with the session's access token. On 401 it refreshes once
 * (concurrent requests wait for the same refresh) and retries the request once with the new
 * token. Requests sent while signed out go out without a token.
 */
export function createAuthFetch(
  tokens: TokenSource,
  baseFetch: (request: Request) => Promise<Response> = (request) => fetch(request),
) {
  return async function authFetch(request: Request): Promise<Response> {
    const retry = request.clone();
    const token = await tokens.getAccessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);

    const response = await baseFetch(request);
    if (response.status !== 401 || !token) return response;

    const body: unknown = await response
      .clone()
      .json()
      .catch(() => null);
    if (!isProblem(body) || !RETRYABLE_AUTH_CODES.has(body.code)) return response;

    const fresh = await tokens.refreshAccessToken();
    if (!fresh) return response;
    retry.headers.set('Authorization', `Bearer ${fresh}`);
    return baseFetch(retry);
  };
}
