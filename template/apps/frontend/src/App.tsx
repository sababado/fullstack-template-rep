import { createQueryClient } from '@app/shared';
import { ThemeProvider } from '@app/ui-kit';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from './core/auth/AuthProvider';
import { router } from './router';

const queryClient = createQueryClient();

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider onSignedIn={(returnTo) => void router.navigate(returnTo, { replace: true })}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
