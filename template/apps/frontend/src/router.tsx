import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AuthCallbackPage } from './core/auth/AuthCallbackPage';
import { RequireAuth } from './core/auth/RequireAuth';
import { AppLayout } from './core/layouts/AppLayout';
import { NotFoundPage } from './core/pages/NotFoundPage';
import { RouteErrorPage } from './core/pages/RouteErrorPage';

export const routes: RouteObject[] = [
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/notes" replace /> },
          {
            path: 'notes',
            // Each feature page loads on demand, keeping the first download small.
            lazy: async () => ({ Component: (await import('./features/notes')).NotesPage }),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
