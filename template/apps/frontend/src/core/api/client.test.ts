import { ApiError } from '@app/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { setAccessTokenGetter } from '../auth/session';
import { json, mockApi } from '../test/mockApi';
import { api, unwrap } from './client';

describe('api client', () => {
  afterEach(() => setAccessTokenGetter(() => undefined));

  it('returns data and sends the access token', async () => {
    setAccessTokenGetter(() => 'token-123');
    const { requests } = mockApi({
      'GET /health': () => json(200, { status: 'ok', version: '1' }),
    });

    await expect(unwrap(api.GET('/health'))).resolves.toEqual({ status: 'ok', version: '1' });
    expect(requests[0]?.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('throws ApiError with the envelope fields', async () => {
    mockApi({
      'GET /notes/:id': () =>
        json(404, {
          error: { code: 'NOTE_NOT_FOUND', message: 'Note not found.', request_id: 'r1' },
        }),
    });

    const failure = unwrap(api.GET('/notes/{note_id}', { params: { path: { note_id: 'x' } } }));

    await expect(failure).rejects.toMatchObject({
      status: 404,
      code: 'NOTE_NOT_FOUND',
      requestId: 'r1',
    });
  });

  it('turns network failures into ApiError', async () => {
    mockApi({ 'GET /health': () => Promise.reject(new TypeError('Failed to fetch')) });

    const error = await unwrap(api.GET('/health')).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
