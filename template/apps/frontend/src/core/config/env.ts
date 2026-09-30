/**
 * The only place that reads import.meta.env (ESLint enforces this). Everything
 * is validated at startup, so a missing variable fails loudly on page load
 * instead of as a confusing error deep in a request.
 */

export interface OidcConfig {
  authority: string;
  clientId: string;
  cognitoDomain: string;
}

export interface Env {
  apiBaseUrl: string;
  authMode: 'local' | 'oidc';
  oidc: OidcConfig | null;
  appVersion: string;
}

type Source = Partial<Record<keyof ImportMetaEnv, string | undefined>>;

function required(source: Source, name: keyof ImportMetaEnv): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. See apps/frontend/.env.example.`);
  return value;
}

export function parseEnv(source: Source): Env {
  const authMode = source.VITE_AUTH_MODE ?? 'oidc';
  if (authMode !== 'local' && authMode !== 'oidc') {
    throw new Error(`VITE_AUTH_MODE must be "local" or "oidc", not "${authMode}".`);
  }
  return {
    apiBaseUrl: required(source, 'VITE_API_BASE_URL').replace(/\/$/, ''),
    authMode,
    oidc:
      authMode === 'oidc'
        ? {
            authority: required(source, 'VITE_OIDC_AUTHORITY'),
            clientId: required(source, 'VITE_OIDC_CLIENT_ID'),
            cognitoDomain: required(source, 'VITE_COGNITO_DOMAIN').replace(/\/$/, ''),
          }
        : null,
    appVersion: source.VITE_APP_VERSION ?? 'dev',
  };
}

export const env: Env = parseEnv(import.meta.env);
