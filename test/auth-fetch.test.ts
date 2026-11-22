import { createAuthFetch } from '@/api/auth-fetch';
import { singleFlight } from '@/lib/single-flight';

import { jsonResponse, problem } from './helpers';

function setup({
  token = 'old',
  fresh = 'new',
}: { token?: string | null; fresh?: string | null } = {}) {
  let current = token;
  const refresh = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    current = fresh;
    return fresh;
  });
  const base = jest.fn<Promise<Response>, [Request]>();
  const authFetch = createAuthFetch(
    { getAccessToken: async () => current, refreshAccessToken: singleFlight(refresh) },
    base,
  );
  return { authFetch, base, refresh };
}

const request = () => new Request('https://api.test/v1/me');

describe('createAuthFetch', () => {
  it('sends the access token as a bearer token', async () => {
    const { authFetch, base } = setup();
    base.mockResolvedValue(jsonResponse(200, { ok: true }));
    await authFetch(request());
    expect(base.mock.calls[0]?.[0].headers.get('Authorization')).toBe('Bearer old');
  });

  it('sends no Authorization header when signed out', async () => {
    const { authFetch, base } = setup({ token: null });
    base.mockResolvedValue(jsonResponse(200, {}));
    await authFetch(request());
    expect(base.mock.calls[0]?.[0].headers.get('Authorization')).toBeNull();
  });

  it('refreshes once on 401 TOKEN_EXPIRED and retries with the new token', async () => {
    const { authFetch, base, refresh } = setup();
    base
      .mockResolvedValueOnce(problem(401, 'TOKEN_EXPIRED'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: 1 }));
    const response = await authFetch(request());
    expect(response.status).toBe(200);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(base.mock.calls[1]?.[0].headers.get('Authorization')).toBe('Bearer new');
  });

  it('retries only once: a second 401 is returned to the caller', async () => {
    const { authFetch, base, refresh } = setup();
    base.mockResolvedValue(problem(401, 'TOKEN_EXPIRED'));
    const response = await authFetch(request());
    expect(response.status).toBe(401);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(base).toHaveBeenCalledTimes(2);
  });

  it('does not refresh on other errors', async () => {
    const { authFetch, base, refresh } = setup();
    base.mockResolvedValue(problem(403, 'FORBIDDEN_ROLE'));
    expect((await authFetch(request())).status).toBe(403);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('returns the 401 when the session cannot be refreshed', async () => {
    const { authFetch, base } = setup({ fresh: null });
    base.mockResolvedValue(problem(401, 'TOKEN_EXPIRED'));
    expect((await authFetch(request())).status).toBe(401);
    expect(base).toHaveBeenCalledTimes(1);
  });

  it('shares one refresh between concurrent requests (rotating refresh tokens must not be reused)', async () => {
    const { authFetch, base, refresh } = setup();
    base.mockImplementation(async (req) =>
      req.headers.get('Authorization') === 'Bearer new'
        ? jsonResponse(200, {})
        : problem(401, 'TOKEN_EXPIRED'),
    );
    const results = await Promise.all([
      authFetch(request()),
      authFetch(request()),
      authFetch(request()),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('replays the original body on retry', async () => {
    const { authFetch, base } = setup();
    base
      .mockResolvedValueOnce(problem(401, 'TOKEN_EXPIRED'))
      .mockResolvedValueOnce(jsonResponse(201, {}));
    await authFetch(
      new Request('https://api.test/v1/classrooms', {
        method: 'POST',
        body: JSON.stringify({ name: 'Maths' }),
      }),
    );
    await expect(base.mock.calls[1]?.[0].json()).resolves.toEqual({ name: 'Maths' });
  });
});

describe('singleFlight', () => {
  it('runs again after the previous call settles', async () => {
    const fn = jest.fn(async () => 1);
    const once = singleFlight(fn);
    await Promise.all([once(), once()]);
    await once();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('releases after a failure', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(2);
    const once = singleFlight(fn);
    await expect(once()).rejects.toThrow('x');
    await expect(once()).resolves.toBe(2);
  });
});
