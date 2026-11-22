/** A JSON Response, as the API would send it. */
export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  const contentType = status >= 400 ? 'application/problem+json' : 'application/json';
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType, ...headers },
  });
}

export function problem(status: number, code: string, extra: Record<string, unknown> = {}) {
  return jsonResponse(status, {
    type: `https://joinly.app/problems/${code.toLowerCase()}`,
    title: code,
    status,
    code,
    requestId: 'req-test',
    ...extra,
  });
}

export const fetchMock = globalThis.fetch as jest.Mock;

/** The request a mocked fetch received (openapi-fetch passes a Request). */
export function requestAt(index: number): Request {
  const call = fetchMock.mock.calls[index];
  if (!call) throw new Error(`fetch was not called ${index + 1} times`);
  return call[0] as Request;
}
