# 0001. Stack choices made by the template

- **Date:** 2026-09-30
- **Status:** Accepted
- **Deciders:** template maintainers

## Context

The project was generated from a template that aims to start new work on current
releases while staying buildable and secure. Several choices were made when the template
was built; this record keeps the reasons.

## Decision

- **SQLAlchemy 2.1 typed models instead of SQLModel.** SQLModel pins SQLAlchemy below
  2.1, and request/response schemas are separate Pydantic models anyway.
- **Tailwind CSS 4, configured in CSS.** The design system lives in one stylesheet,
  `packages/ui-kit/src/styles.css`: token variables, `@theme inline`, the dark variant,
  and `@source` so apps pick up the kit's classes by importing it. There is no
  JavaScript config or PostCSS setup; the Vite plugin handles the build.
- **TypeScript 6.0, not 7.** TypeScript 7 (the native compiler) is out, but
  typescript-eslint and openapi-typescript support only up to 6.x.
- **No eslint-plugin-jsx-a11y.** It hasn't been released since 2024 and doesn't support
  ESLint 10. Accessibility is enforced by axe in the UI kit's story tests instead.
- **API Gateway HTTP API, not REST API.** It is cheaper and has a built-in JWT
  authorizer. REST API is only needed for usage plans, API keys, or request validation
  at the gateway.
- **One route per HTTP method, not `ANY`.** An `ANY` catch-all would also receive CORS
  preflight requests and send them through the authorizer, failing every browser call.
- **No NAT gateway.** Lambdas run in private subnets and reach Secrets Manager through a
  VPC endpoint. This is cheaper and keeps the functions off the internet.
- **Python 3.14 on arm64 with SnapStart (outside dev).** Latest runtime with library
  wheels available; arm64 is cheaper; SnapStart cuts cold starts.
- **One event loop per Lambda environment.** Mangum calls `asyncio.get_event_loop()`,
  which raises on Python 3.14 when the thread has no loop, as in the Lambda runtime.
  `app.handler` creates the loop once and sets it on every invocation.

### Invariants

1. Services never import `HTTPException`; failures are `AppError` subclasses.
2. `core` never imports `features`, and features never import each other (import-linter).
3. `import.meta.env` is read only in `apps/frontend/src/core/config/env.ts` (ESLint).
4. The API function has no `ANY` routes.
5. No module performs network I/O at import time.
6. No `tailwind.config.*` file exists; design tokens are defined only in
   `packages/ui-kit/src/styles.css`.
7. Source files use no Tailwind v3-only utilities (`bg-opacity-*`, `text-opacity-*`,
   `flex-shrink-*`, `flex-grow-*`, `overflow-ellipsis`), which v4 silently ignores.

## Consequences

- Moving to TypeScript 7 or adding jsx-a11y back is a small change once the ecosystem
  catches up; revisit when typescript-eslint supports TS 7.
- Calling an outside API from Lambda requires a NAT gateway or a VPC endpoint.

## References

- `apps/backend/pyproject.toml` (import-linter contracts), `eslint.config.js`
- `apps/backend/src/app.py` (event loop), `apps/backend/tests/unit/test_app.py`
- `apps/backend/infra/api.yaml` (routes), `apps/backend/infra/network.yaml`
- `packages/ui-kit/src/styles.css` (Tailwind theme), `scripts/check-tailwind-v4.mjs`
  (invariants 6 and 7, run by `npm run lint`)
