import type { ReactNode } from 'react';
import { AuthContext, type AuthState } from './authContext';

const localAuth: AuthState = {
  status: 'authenticated',
  user: { name: 'Local developer', email: null },
  error: null,
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
};

/** VITE_AUTH_MODE=local: everyone is the local developer; the backend runs with AUTH_MODE=local. */
export function LocalAuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext value={localAuth}>{children}</AuthContext>;
}
