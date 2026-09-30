import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useAuth } from './authContext';
import { AuthProvider } from './AuthProvider';

describe('AuthProvider', () => {
  it('uses the local developer in local mode (the test env)', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider onSignedIn={() => undefined}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user?.name).toBe('Local developer');
    await expect(result.current.signIn()).resolves.toBeUndefined();
    await expect(result.current.signOut()).resolves.toBeUndefined();
  });

  it('requires a provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
