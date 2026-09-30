# Security

Defense in depth: each layer checks what it can, and no layer trusts the one before it.

| Layer | What it enforces | Where |
| --- | --- | --- |
| CloudFront | HTTPS only, security headers, Content Security Policy | `apps/frontend/template.yaml` |
| Web app | Field lengths and required fields (for feedback only, never trusted) | feature components |
| API Gateway | Valid Cognito access token on every route except `/health`; throttling; CORS | `apps/backend/infra/api.yaml` |
| API schemas | Types, lengths, unknown fields rejected, HTML stripped | `core/schemas/` |
| Services | Authorization: every query scoped to the caller | `features/*/service.py` |
| Database | Column lengths, NOT NULL, constraints; private network only | models + migrations, `infra/database.yaml` |

## Input validation

- Request schemas extend `BaseSchema`: strings trimmed, unknown fields rejected.
- Text uses `ShortString` (required, 200), `MediumString` (1000), or `LongString` (5000).
  These strip every HTML tag, including entity-encoded ones, so stored text is plain text.
- Use enums (`Literal[...]` or `StrEnum`) for status-like fields, never free strings.
- Queries go through SQLAlchemy with bound parameters. Never build SQL with f-strings.

## Authentication and authorization

- Cognito hosts sign-in. The web app uses authorization code + PKCE; no client secret
  exists in the browser.
- API Gateway rejects requests without a valid token before Lambda runs. The backend
  reads the verified claims only; it never parses tokens itself.
- Authorization is the service's job: scope queries to `principal.sub`, and answer 404
  (not 403) for records the caller doesn't own, so IDs don't leak.
- Group-restricted routes use `require_group(...)`. Group membership is managed in Cognito.
- `AUTH_MODE=local` (no auth) is refused unless `APP_ENV` is `local` or `test`.

## Secrets

- No secrets in the repository, in `.env.*` files that are committed, or in logs.
- The database password is an RDS-managed Secrets Manager secret that rotates
  automatically. The API reads it per connection (cached for 5 minutes).
- CI uses GitHub OIDC roles, never long-lived AWS keys.
- Secrets the app needs later belong in Secrets Manager or SSM Parameter Store
  (SecureString), read at runtime, with IAM access limited to that one secret.

## Data protection

- Encryption at rest: RDS storage, S3 buckets, SNS topic. In transit: TLS everywhere
  (CloudFront, API Gateway, RDS with `ssl=require`).
- The database and Lambdas sit in private subnets with no internet route.
- Logs are structured and must not contain tokens, passwords, or personal data.
  Log IDs, not names or emails.

### Personal data checklist

- [ ] Collect only what the feature needs, and document why.
- [ ] Decide how long it's kept and how a user's data is deleted.
- [ ] Don't copy it into logs, analytics, or error messages.

## Browser security

- CSP: scripts and styles only from the site itself; network calls only to the site,
  the API, and Cognito. If the API moves to a custom domain, update `connect-src`.
- HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, a strict referrer policy, and
  a restrictive `Permissions-Policy`.
- React escapes rendered text. Never use `dangerouslySetInnerHTML` with data from users.

## Dependencies and code scanning

- Dependabot opens weekly update PRs (npm, uv, GitHub Actions).
- `dependency-audit.yml` fails on high or critical npm advisories and on any known
  vulnerability in what ships to Lambda.
- CodeQL scans TypeScript and Python on every PR and weekly.

## Documented exceptions

Record every deliberate exception to these rules, with its compensating control.

| Scope | Where | Exception | Why | Compensating control |
| --- | --- | --- | --- | --- |
| _none yet_ | | | | |

## Reporting a vulnerability

Don't open a public issue. Contact the maintainers privately (see CODEOWNERS) with the
details and steps to reproduce.
