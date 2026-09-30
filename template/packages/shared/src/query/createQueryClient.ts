import { MutationCache, QueryClient } from '@tanstack/react-query';
import { retryDelay, shouldRetryQuery } from './retryPolicy';

export interface QueryClientOptions {
  /**
   * Called for every failed mutation unless the mutation sets
   * `meta: { handlesErrors: true }` (for example a form that shows field errors).
   */
  onMutationError?: (error: unknown) => void;
}

export function createQueryClient({ onMutationError }: QueryClientOptions = {}): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.['handlesErrors'] === true) return;
        onMutationError?.(error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
        retryDelay,
        // Don't hammer a failing endpoint every time the window regains focus.
        refetchOnWindowFocus: (query) => query.state.status !== 'error',
      },
      // Mutations aren't idempotent in general; never retry them automatically.
      mutations: { retry: false },
    },
  });
}
