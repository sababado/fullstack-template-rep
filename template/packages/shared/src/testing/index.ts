import { QueryClient } from '@tanstack/react-query';
import { ApiError, type ApiFieldError } from '../errors/ApiError';

/** A QueryClient for tests: no retries, no caching between tests. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/** The JSON body the backend returns for an error, for mocking fetch. */
export function errorEnvelope(code: string, message: string, fields: ApiFieldError[] = []) {
  return {
    error: { code, message, request_id: 'test-request', fields: fields.length ? fields : null },
  };
}

export function apiError(status: number, code: string, message = 'Failed.'): ApiError {
  return new ApiError(status, code, message, 'test-request');
}
