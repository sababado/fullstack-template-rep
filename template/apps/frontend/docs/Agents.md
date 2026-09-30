# Frontend guide (`apps/frontend`)

React 19 single-page app: Vite 8, React Router 8, TanStack Query 5, react-i18next
with ICU messages, TypeScript 6 (strict). UI comes from `@app/ui-kit`.

## Layout

```
src/
  main.tsx, App.tsx     Entry point and providers (theme, auth, query client, router)
  router.tsx            Route tree; feature pages load lazily
  index.css             Tailwind + the UI kit's tokens
  core/                 App-wide code
    api/                client.ts (typed client, unwrap), schema.d.ts (generated)
    auth/               AuthProvider (local or OIDC), useAuth, RequireAuth
    config/             env.ts (the only reader of import.meta.env), i18n.ts, app.ts
    errors/             useErrorMessage: any error to a translated message
    i18n/               resources.ts and locales/<lang>/<namespace>.ts
    layouts/, pages/    AppLayout, NotFoundPage, RouteErrorPage
    test/               setup.ts, renderApp, mockApi
  features/<name>/      One folder per feature
    api/                Functions that call the typed client
    hooks/              React Query hooks and query keys
    components/         Feature components (composed from the UI kit)
    pages/              Route components
    __tests__/          Tests
    index.ts            The feature's public exports; other code imports only this
```

## Adding a feature

1. Add the backend endpoints first, then run `npm run gen:api` so the types exist.
2. Create `src/features/<name>/` following `features/notes/`.
3. Put API calls in `api/`, wrapped in `unwrap(...)`, and React Query hooks with a
   query-key factory in `hooks/`.
4. Add a lazy route in `router.tsx`: `lazy: async () => ({ Component: (await import('./features/<name>')).Page })`.
5. Add a locale namespace in `core/i18n/locales/en/<name>.ts` and register it in
   `core/i18n/resources.ts`. Add translations for any new backend error codes to `errors.ts`.
6. Add a nav link in `core/layouts/AppLayout.tsx` if it's a top-level page.
7. Write tests with `renderApp` and `mockApi`.

## Rules

### Data fetching

- Call the API only through `api` from `core/api/client.ts`. Paths, params, bodies, and
  responses are type-checked against the backend contract.
- `unwrap()` turns every failure into `ApiError` (`status`, `code`, `fields`, `requestId`).
- Server state lives in React Query; don't copy it into `useState`.
- Mutations invalidate the queries they affect. A mutation whose errors the component
  shows itself sets `meta: { handlesErrors: true }`.
- Mutations never retry automatically; queries retry once and only for retryable errors
  (see `@app/shared`).

### Errors and states

- Every data view handles loading (`Spinner` with a label), error (`Alert` plus a retry),
  and empty (`EmptyState`).
- Show API field errors next to the field: `error.fieldError('title')`.
- Turn other errors into text with `useErrorMessage()`; never render `error.message`
  from an unknown error.

### UI and styling

- Build screens from `@app/ui-kit` components. If a component is missing, add it to the
  UI kit (with a story and a test) instead of styling raw elements in the app.
- Semantic tokens only (`bg-surface`, `text-muted-foreground`). No raw palette colors, no
  arbitrary values like `text-[#333]`.
- Headings are in order (one `h1` per page), every control has a label, and icon-only
  buttons have an `aria-label`.

### Text

- Every user-visible string comes from `t()`. Keys are type-checked against
  `locales/en`.
- Messages use ICU syntax: `{name}`, `{count, plural, one {# note} other {# notes}}`,
  `{date, date, medium}`.

### Configuration and auth

- Read settings only from `env` in `core/config/env.ts` (ESLint blocks `import.meta.env`
  elsewhere). New variables go in `vite-env.d.ts`, `env.ts`, `.env.example`, and the
  deploy workflow.
- `VITE_AUTH_MODE=local` signs everyone in as a local developer (pairs with the backend's
  `AUTH_MODE=local`). `oidc` uses Cognito; the token is attached to API calls automatically.

## Testing

- `renderApp('/path', { auth })` renders the real route tree with test providers.
- `mockApi({ 'GET /notes': () => json(200, {...}) })` stubs fetch; unmatched requests
  return a 404 envelope so a missing mock fails loudly.
- Query by role and accessible name (`getByRole('button', { name: 'Add note' })`), not by
  test IDs or classes.
- Coverage floors are in `vite.config.ts`. Raise them as coverage grows; never lower them.

## Verifiability checklist

From the repo root:

```bash
npm run lint
npm run typecheck
npm test
npm run build -w @app/frontend
npm run gen:api && git diff --exit-code   # the contract and types are current
```
