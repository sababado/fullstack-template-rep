import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('reads local settings', () => {
    expect(parseEnv({ VITE_API_BASE_URL: '/api/', VITE_AUTH_MODE: 'local' })).toEqual({
      apiBaseUrl: '/api',
      authMode: 'local',
      oidc: null,
      appVersion: 'dev',
    });
  });

  it('requires the OIDC settings in oidc mode (the default)', () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: 'https://api.example.com' })).toThrow(
      /VITE_OIDC_AUTHORITY/,
    );
    expect(
      parseEnv({
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_OIDC_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/pool',
        VITE_OIDC_CLIENT_ID: 'client',
        VITE_COGNITO_DOMAIN: 'https://auth.example.com/',
        VITE_APP_VERSION: 'abc123',
      }),
    ).toMatchObject({
      authMode: 'oidc',
      appVersion: 'abc123',
      oidc: { cognitoDomain: 'https://auth.example.com' },
    });
  });

  it('rejects unknown auth modes and a missing API URL', () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: '/api', VITE_AUTH_MODE: 'magic' })).toThrow(
      /VITE_AUTH_MODE/,
    );
    expect(() => parseEnv({ VITE_AUTH_MODE: 'local' })).toThrow(/VITE_API_BASE_URL/);
  });
});
