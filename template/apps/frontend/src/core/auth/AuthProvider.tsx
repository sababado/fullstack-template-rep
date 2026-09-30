import type { ReactNode } from 'react';
import { env } from '../config/env';
import { LocalAuthProvider } from './LocalAuthProvider';
import { OidcAuthProvider } from './OidcAuthProvider';

export function AuthProvider({
  onSignedIn,
  children,
}: {
  onSignedIn: (returnTo: string) => void;
  children: ReactNode;
}) {
  if (env.authMode === 'local' || !env.oidc) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }
  return (
    <OidcAuthProvider config={env.oidc} onSignedIn={onSignedIn}>
      {children}
    </OidcAuthProvider>
  );
}
