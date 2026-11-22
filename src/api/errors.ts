import type { components } from './schema.gen';

export type Problem = components['schemas']['Problem'];
export type ServerErrorCode = components['schemas']['ErrorCode'];
/** Server codes, plus two the client produces itself. */
export type ErrorCode = ServerErrorCode | 'NETWORK' | 'UNKNOWN';

export type FieldError = { path: string; message: string };

/**
 * Every failed API call becomes an ApiError. Screens branch on `code`, the stable machine-readable
 * value from the API's RFC 9457 problem details, never on status text or messages.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fieldErrors: FieldError[];
  readonly retryAfterSeconds: number | null;
  readonly requestId: string | null;

  constructor(options: {
    status: number;
    code: ErrorCode;
    message: string;
    fieldErrors?: FieldError[];
    retryAfterSeconds?: number | null;
    requestId?: string | null;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors ?? [];
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
    this.requestId = options.requestId ?? null;
  }

  static network(cause: unknown): ApiError {
    return new ApiError({ status: 0, code: 'NETWORK', message: 'Network request failed', cause });
  }

  static fromResponse(response: Response, body: unknown): ApiError {
    const retryHeader = Number(response.headers.get('Retry-After'));
    if (isProblem(body)) {
      return new ApiError({
        status: response.status,
        code: body.code,
        message: body.detail ?? body.title,
        fieldErrors: body.errors,
        retryAfterSeconds:
          body.retryAfterSeconds ??
          (Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : null),
        requestId: body.requestId,
      });
    }
    return new ApiError({
      status: response.status,
      code: 'UNKNOWN',
      message: `Unexpected response (${response.status})`,
    });
  }
}

export function isProblem(body: unknown): body is Problem {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Problem).code === 'string' &&
    typeof (body as Problem).status === 'number'
  );
}

export function isApiError(error: unknown, ...codes: ErrorCode[]): error is ApiError {
  return error instanceof ApiError && (codes.length === 0 || codes.includes(error.code));
}
