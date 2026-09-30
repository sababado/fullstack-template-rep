# Shared package guide (`packages/shared`)

Non-UI TypeScript used by more than one app. UI belongs in `@app/ui-kit`; code used by
one app stays in that app. Move code here when a second app needs it, instead of
copying it.

## Contents

- `ApiError` and `isApiError`: parse the backend's error envelope
  (`{"error": {"code", "message", "request_id", "fields"}}`); network failures become
  status 0 with code `NETWORK_ERROR`.
- `createQueryClient()`: React Query defaults. Queries retry once and only for
  retryable failures (network, 408, 429, 5xx) with jittered backoff; mutations never
  retry; `onMutationError` reports mutations that don't set `meta: { handlesErrors: true }`.
- `useDebouncedValue()`.
- `@app/shared/testing`: `createTestQueryClient()`, `errorEnvelope()`, `apiError()`.

## Rules

- No React components with markup (those go in the UI kit) and no app-specific code.
- Everything exported has a unit test. Coverage floors are in `vitest.config.ts`.

## Verifiability checklist

```bash
npm run typecheck -w @app/shared
npm test -w @app/shared
```
