/**
 * Wraps an async function so that concurrent callers share one in-flight call.
 * Used for token refresh: with rotating refresh tokens, two parallel refreshes would present the
 * same token twice, which the API treats as theft and answers by revoking the whole session.
 */
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;
  return () => {
    inFlight ??= fn().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
