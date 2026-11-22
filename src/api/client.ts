import createClient from 'openapi-fetch';

import { config } from '@/lib/config';

import { createAuthFetch, type TokenSource } from './auth-fetch';
import { ApiError } from './errors';
import type { components, paths } from './schema.gen';

export type Schemas = components['schemas'];
export type User = Schemas['User'];
export type Role = Schemas['Role'];
export type AuthSession = Schemas['AuthSession'];
export type TokenPair = Schemas['TokenPair'];
export type Classroom = Schemas['Classroom'];
export type JoinCode = Schemas['JoinCode'];
export type RosterStudent = Schemas['RosterStudent'];
export type ClassroomPreview = Schemas['ClassroomPreview'];
export type ClassroomSummary = Schemas['ClassroomSummary'];
export type Enrollment = Schemas['Enrollment'];
export type JoinedVia = Schemas['JoinedVia'];

let tokenSource: TokenSource = {
  getAccessToken: async () => null,
  refreshAccessToken: async () => null,
};

/** The session module plugs itself in at startup; this keeps the API layer free of UI state. */
export function setTokenSource(source: TokenSource): void {
  tokenSource = source;
}

const authFetch = createAuthFetch({
  getAccessToken: () => tokenSource.getAccessToken(),
  refreshAccessToken: () => tokenSource.refreshAccessToken(),
});

/** Typed client for every authenticated call. Paths, params and bodies are checked against the API's OpenAPI document. */
export const api = createClient<paths>({ baseUrl: config.apiUrl, fetch: authFetch });

/** Unauthenticated client for the token endpoints themselves (refresh must never recurse into refresh). */
export const publicApi = createClient<paths>({ baseUrl: config.apiUrl });

type Result = { data?: unknown; error?: unknown; response: Response };
type Data<R extends Result> = [Exclude<R['data'], undefined>] extends [never]
  ? void
  : Exclude<R['data'], undefined>;

/** Awaits an openapi-fetch call and returns its data, or throws an ApiError. */
export async function unwrap<R extends Result>(call: Promise<R>): Promise<Data<R>> {
  let result: R;
  try {
    result = await call;
  } catch (cause) {
    throw ApiError.network(cause);
  }
  if (!result.response.ok || result.error !== undefined) {
    throw ApiError.fromResponse(result.response, result.error);
  }
  return result.data as Data<R>;
}
