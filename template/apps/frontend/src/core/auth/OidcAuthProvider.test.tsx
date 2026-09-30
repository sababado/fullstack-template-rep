import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './authContext';
import { OidcAuthProvider } from './OidcAuthProvider';
import { getAccessToken, setAccessTokenGetter } from './session';

interface OidcMock {
  state: Record<string, unknown>;
  onSigninCallback?: (user: unknown) => void;
}

const oidc = vi.hoisted((): OidcMock => ({ state: {} }));

vi.mock('react-oidc-context', () => ({
  AuthProvider: ({
    children,
    onSigninCallback,
  }: {
    children: ReactNode;
    onSigninCallback: (user: unknown) => void;
  }) => {
    oidc.onSigninCallback = onSigninCallback;
    return children;
  },
  useAuth: () => oidc.state,
}));

const config = {
  authority: 'https://cognito-idp.us-east-1.amazonaws.com/pool',
  clientId: 'client-1',
  cognitoDomain: 'https://auth.example.com',
};

function setOidc(state: Record<string, unknown>) {
  oidc.state = {
    isLoading: false,
    activeNavigator: undefined,
    error: undefined,
    isAuthenticated: false,
    user: null,
    signinRedirect: vi.fn(() => Promise.resolve()),
    removeUser: vi.fn(() => Promise.resolve()),
    ...state,
  };
}

function renderAuth(onSignedIn = vi.fn()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <OidcAuthProvider config={config} onSignedIn={onSignedIn}>
      {children}
    </OidcAuthProvider>
  );
  return { ...renderHook(() => useAuth(), { wrapper }), onSignedIn };
}

describe('OidcAuthProvider', () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('location', { ...window.location, origin: 'https://app.example.com', assign });
  });

  afterEach(() => {
    setAccessTokenGetter(() => undefined);
    assign.mockReset();
  });

  it.each([
    [{ isLoading: true }, 'loading'],
    [{ activeNavigator: 'signinRedirect' }, 'loading'],
    [{ error: new Error('denied') }, 'error'],
    [{}, 'anonymous'],
  ])('maps %o to %s', (state, status) => {
    setOidc(state);
    expect(renderAuth().result.current.status).toBe(status);
  });

  it('exposes the signed-in user and registers the access token', () => {
    setOidc({
      isAuthenticated: true,
      user: { access_token: 'token-1', profile: { sub: 'u1', email: 'ada@example.com' } },
    });

    const { result } = renderAuth();

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual({ name: 'ada@example.com', email: 'ada@example.com' });
    expect(getAccessToken()).toBe('token-1');
  });

  it('remembers where to return after sign-in', async () => {
    setOidc({});
    const { result, onSignedIn } = renderAuth();

    await result.current.signIn('/notes?x=1');
    oidc.onSigninCallback?.({ state: { returnTo: '/notes?x=1' } });
    oidc.onSigninCallback?.(undefined);

    expect(oidc.state['signinRedirect']).toHaveBeenCalledWith({
      state: { returnTo: '/notes?x=1' },
    });
    expect(onSignedIn).toHaveBeenNthCalledWith(1, '/notes?x=1');
    expect(onSignedIn).toHaveBeenNthCalledWith(2, '/');
  });

  it('signs out locally, then through the Cognito logout endpoint', async () => {
    setOidc({ isAuthenticated: true, user: { access_token: 't', profile: { sub: 'u1' } } });
    const { result } = renderAuth();

    await result.current.signOut();

    expect(oidc.state['removeUser']).toHaveBeenCalled();
    const url = new URL(assign.mock.calls[0]?.[0] as string);
    expect(url.origin + url.pathname).toBe('https://auth.example.com/logout');
    expect(url.searchParams.get('client_id')).toBe('client-1');
    expect(url.searchParams.get('logout_uri')).toBe('https://app.example.com');
  });

  it('renders children', () => {
    setOidc({});
    render(
      <OidcAuthProvider config={config} onSignedIn={vi.fn()}>
        <p>child</p>
      </OidcAuthProvider>,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
