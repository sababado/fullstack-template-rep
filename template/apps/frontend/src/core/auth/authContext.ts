import { createContext, useContext } from 'react';

export interface CurrentUser {
  name: string;
  email: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

export interface AuthState {
  status: AuthStatus;
  user: CurrentUser | null;
  error: Error | null;
  /** Start sign-in, returning to `returnTo` (default: the current page) afterwards. */
  signIn: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>.');
  return auth;
}
