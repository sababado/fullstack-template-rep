import { isApiError } from '../errors/ApiError';

/** Statuses worth retrying: timeouts, rate limits, and server/gateway failures. */
export function isRetryableStatus(status: number): boolean {
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

/** Retry a failed query once, and only when retrying could help. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return isApiError(error) ? isRetryableStatus(error.status) : true;
}

/** Exponential backoff with +/-25% jitter so clients don't retry in lockstep. */
export function backoffDelay(attempt: number, random: () => number): number {
  const base = Math.min(1000 * 2 ** attempt, 10_000);
  return Math.round(base * (0.75 + random() * 0.5));
}

/** React Query `retryDelay`. */
export function retryDelay(attempt: number): number {
  return backoffDelay(attempt, Math.random);
}
