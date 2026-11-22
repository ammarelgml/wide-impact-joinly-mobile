import { ApiError, isApiError } from '@/api/errors';
import { errorMessage, formatWait } from '@/api/messages';
import { shouldRetry } from '@/api/query-client';

import { problem } from './helpers';

describe('ApiError.fromResponse', () => {
  it('keeps the stable code, field errors and retry hint from problem details', async () => {
    const response = problem(429, 'RATE_LIMITED', { retryAfterSeconds: 90, detail: 'Slow down' });
    const error = ApiError.fromResponse(response, await response.clone().json());
    expect(error).toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
      retryAfterSeconds: 90,
      requestId: 'req-test',
    });
    expect(error.message).toBe('Slow down');
  });

  it('falls back to the Retry-After header', async () => {
    const response = new Response(
      JSON.stringify({ type: 't', title: 't', status: 429, code: 'RATE_LIMITED', requestId: 'r' }),
      {
        status: 429,
        headers: { 'Retry-After': '30' },
      },
    );
    expect(ApiError.fromResponse(response, await response.clone().json()).retryAfterSeconds).toBe(
      30,
    );
  });

  it('marks a non-problem body as UNKNOWN', () => {
    const error = ApiError.fromResponse(new Response('<html>', { status: 502 }), '<html>');
    expect(error).toMatchObject({ status: 502, code: 'UNKNOWN' });
  });
});

describe('errorMessage', () => {
  const err = (code: ConstructorParameters<typeof ApiError>[0]['code'], extra = {}) =>
    new ApiError({ status: 400, code, message: code, ...extra });

  it('tells the student what to do for each join failure', () => {
    expect(errorMessage(err('JOIN_CODE_EXPIRED'))).toBe(
      'This code has expired. Ask your teacher for a new one.',
    );
    expect(errorMessage(err('JOIN_CODE_INVALID'))).toMatch(/doesn't match any class/);
    expect(errorMessage(err('JOINING_CLOSED'))).toMatch(/not accepting new students/);
    expect(errorMessage(err('RATE_LIMITED', { retryAfterSeconds: 75 }))).toBe(
      'Too many attempts. Try again in 1:15.',
    );
  });

  it('covers offline and unknown errors', () => {
    expect(errorMessage(ApiError.network(new TypeError('x')))).toMatch(/connection/);
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });

  it('shows the first field error for validation failures', () => {
    expect(
      errorMessage(
        err('VALIDATION_FAILED', { fieldErrors: [{ path: 'name', message: 'Too long' }] }),
      ),
    ).toBe('Too long');
  });
});

describe('formatWait', () => {
  it('formats countdowns', () => {
    expect(formatWait(1)).toBe('1 second');
    expect(formatWait(40)).toBe('40 seconds');
    expect(formatWait(900)).toBe('15:00');
    expect(formatWait(-5)).toBe('0 seconds');
  });
});

describe('shouldRetry', () => {
  it('retries network and server errors twice, never answers', () => {
    expect(shouldRetry(0, ApiError.network(null))).toBe(true);
    expect(shouldRetry(0, new ApiError({ status: 503, code: 'INTERNAL', message: '' }))).toBe(true);
    expect(shouldRetry(2, ApiError.network(null))).toBe(false);
    expect(shouldRetry(0, new ApiError({ status: 404, code: 'NOT_FOUND', message: '' }))).toBe(
      false,
    );
    expect(shouldRetry(0, new Error('x'))).toBe(false);
  });

  it('isApiError narrows by code', () => {
    expect(isApiError(ApiError.network(null), 'NETWORK')).toBe(true);
    expect(isApiError(ApiError.network(null), 'NOT_FOUND')).toBe(false);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});
