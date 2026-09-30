import { describe, expect, it } from 'vitest';
import { apiError } from '../testing';
import { backoffDelay, isRetryableStatus, retryDelay, shouldRetryQuery } from './retryPolicy';

describe('retry policy', () => {
  it.each([
    [0, true],
    [408, true],
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [401, false],
    [404, false],
    [422, false],
  ])('status %i retryable: %s', (status, expected) => {
    expect(isRetryableStatus(status)).toBe(expected);
  });

  it('retries a query at most once, and only for retryable failures', () => {
    expect(shouldRetryQuery(0, apiError(503, 'UNAVAILABLE'))).toBe(true);
    expect(shouldRetryQuery(0, apiError(404, 'NOT_FOUND'))).toBe(false);
    expect(shouldRetryQuery(0, new Error('unknown'))).toBe(true);
    expect(shouldRetryQuery(1, apiError(503, 'UNAVAILABLE'))).toBe(false);
  });

  it('backs off exponentially with bounded jitter', () => {
    expect(backoffDelay(0, () => 0)).toBe(750);
    expect(backoffDelay(0, () => 1)).toBe(1250);
    expect(backoffDelay(1, () => 0.5)).toBe(2000);
    expect(backoffDelay(10, () => 0.5)).toBe(10_000);
    expect(retryDelay(0)).toBeGreaterThanOrEqual(750);
  });
});
