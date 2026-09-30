/**
 * Typed API client, generated from the backend's OpenAPI contract.
 *
 *   const note = await unwrap(api.POST('/notes', { body: { title } }));
 *
 * Paths, params, bodies, and responses are all checked against
 * src/core/api/schema.d.ts. Regenerate it after changing the backend:
 *   npm run gen:api
 */

import { ApiError } from '@app/shared';
import createClient, { type Middleware } from 'openapi-fetch';
import { getAccessToken } from '../auth/session';
import { env } from '../config/env';
import type { components, paths } from './schema';

export type Schemas = components['schemas'];

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: env.apiBaseUrl,
  // Look fetch up on each call so tests can stub it.
  fetch: (request) => globalThis.fetch(request),
});
api.use(authMiddleware);

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Return the response data, or throw ApiError for any failure (including network errors). */
export async function unwrap<T>(call: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await call;
  } catch (cause) {
    throw ApiError.network(cause);
  }
  if (!result.response.ok) throw ApiError.fromResponse(result.response.status, result.error);
  return result.data as T;
}
