import { describe, expect, it } from 'vitest';
import { errorEnvelope } from '../testing';
import { ApiError, isApiError } from './ApiError';

describe('ApiError', () => {
  it('parses the backend error envelope', () => {
    const error = ApiError.fromResponse(
      422,
      errorEnvelope('VALIDATION_ERROR', 'Some fields need attention.', [
        { field: 'title', message: 'Too long', type: 'string_too_long' },
      ]),
    );

    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'test-request',
    });
    expect(error.fieldError('title')).toBe('Too long');
    expect(error.fieldError('body')).toBeUndefined();
    expect(isApiError(error)).toBe(true);
  });

  it('falls back for bodies that are not the envelope', () => {
    for (const body of [null, 'Bad gateway', { detail: 'x' }, { error: { code: 1 } }]) {
      expect(ApiError.fromResponse(502, body)).toMatchObject({ status: 502, code: 'HTTP_502' });
    }
  });

  it('represents network failures', () => {
    const cause = new TypeError('Failed to fetch');
    const error = ApiError.network(cause);

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(error.cause).toBe(cause);
    expect(isApiError(cause)).toBe(false);
  });
});
