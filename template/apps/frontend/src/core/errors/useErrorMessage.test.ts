import { ApiError } from '@app/shared';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useErrorMessage } from './useErrorMessage';

describe('useErrorMessage', () => {
  it('translates known codes and falls back safely', () => {
    const { result } = renderHook(() => useErrorMessage());
    const message = result.current;

    expect(message(new ApiError(404, 'NOTE_NOT_FOUND', 'Note not found.'))).toBe(
      'That note no longer exists.',
    );
    expect(message(new ApiError(409, 'SOMETHING_NEW', 'Backend safe message.'))).toBe(
      'Backend safe message.',
    );
    expect(message(new Error('internal detail'))).toBe('Something went wrong. Try again.');
  });
});
