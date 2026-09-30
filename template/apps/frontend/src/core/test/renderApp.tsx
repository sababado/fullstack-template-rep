import { createTestQueryClient } from '@app/shared/testing';
import { ThemeProvider } from '@app/ui-kit';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/router';
import { AuthContext, type AuthState } from '../auth/authContext';

export const signedInAuth: AuthState = {
  status: 'authenticated',
  user: { name: 'Ada Lovelace', email: 'ada@example.com' },
  error: null,
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
};

/** Render the real route tree at `path` with test providers. */
export function renderApp(path: string, { auth = {} }: { auth?: Partial<AuthState> } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const utils = render(
    <ThemeProvider>
      <AuthContext value={{ ...signedInAuth, ...auth }}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthContext>
    </ThemeProvider>,
  );
  return { ...utils, router, queryClient };
}
