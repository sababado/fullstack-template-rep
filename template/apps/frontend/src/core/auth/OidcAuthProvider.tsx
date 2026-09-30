import { WebStorageStateStore } from 'oidc-client-ts';
import { useEffect, useMemo, type ReactNode } from 'react';
import { AuthProvider as OidcProvider, useAuth as useOidc } from 'react-oidc-context';
import type { OidcConfig } from '../config/env';
import { AuthContext, type AuthState } from './authContext';
import { setAccessTokenGetter } from './session';

interface Props {
  config: OidcConfig;
  /** Where to go once the sign-in redirect completes. */
  onSignedIn: (returnTo: string) => void;
  children: ReactNode;
}

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** Signs in through the Cognito hosted UI (authorization code + PKCE). */
export function OidcAuthProvider({ config, onSignedIn, children }: Props) {
  return (
    <OidcProvider
      authority={config.authority}
      client_id={config.clientId}
      redirect_uri={`${window.location.origin}/auth/callback`}
      post_logout_redirect_uri={window.location.origin}
      scope="openid email profile"
      userStore={new WebStorageStateStore({ store: window.sessionStorage })}
      onSigninCallback={(user) => {
        const state = user?.state as { returnTo?: string } | undefined;
        onSignedIn(state?.returnTo ?? '/');
      }}
    >
      <OidcBridge config={config}>{children}</OidcBridge>
    </OidcProvider>
  );
}

function OidcBridge({ config, children }: { config: OidcConfig; children: ReactNode }) {
  const oidc = useOidc();
  const accessToken = oidc.user?.access_token;

  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  const value = useMemo<AuthState>(() => {
    const profile = oidc.user?.profile;
    let status: AuthState['status'] = 'anonymous';
    if (oidc.isLoading || oidc.activeNavigator) status = 'loading';
    else if (oidc.error) status = 'error';
    else if (oidc.isAuthenticated) status = 'authenticated';
    return {
      status,
      user: profile
        ? { name: profile.name ?? profile.email ?? profile.sub, email: profile.email ?? null }
        : null,
      error: oidc.error ?? null,
      signIn: (returnTo = currentPath()) => oidc.signinRedirect({ state: { returnTo } }),
      // Cognito has no OIDC end_session endpoint: clear the local session, then
      // send the browser to the hosted UI's logout URL.
      signOut: async () => {
        await oidc.removeUser();
        const logout = new URL('/logout', config.cognitoDomain);
        logout.searchParams.set('client_id', config.clientId);
        logout.searchParams.set('logout_uri', window.location.origin);
        window.location.assign(logout.toString());
      },
    };
  }, [oidc, config]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
