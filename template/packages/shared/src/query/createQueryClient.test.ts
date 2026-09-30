import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../testing';
import { createQueryClient } from './createQueryClient';

describe('createQueryClient', () => {
  it('reports mutation errors unless the mutation handles them', async () => {
    const onMutationError = vi.fn();
    const client = createQueryClient({ onMutationError });
    const fail = () => Promise.reject(new Error('boom'));

    await client
      .getMutationCache()
      .build(client, { mutationFn: fail })
      .execute(undefined)
      .catch(() => undefined);
    await client
      .getMutationCache()
      .build(client, { mutationFn: fail, meta: { handlesErrors: true } })
      .execute(undefined)
      .catch(() => undefined);

    expect(onMutationError).toHaveBeenCalledOnce();
  });

  it('never retries mutations', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
    expect(createTestQueryClient().getDefaultOptions().queries?.retry).toBe(false);
  });

  it('skips focus refetches for queries in an error state', () => {
    const refetch = createQueryClient().getDefaultOptions().queries?.refetchOnWindowFocus;
    expect(typeof refetch).toBe('function');
    const decide = refetch as (query: { state: { status: string } }) => boolean;
    expect(decide({ state: { status: 'error' } })).toBe(false);
    expect(decide({ state: { status: 'success' } })).toBe(true);
  });
});
