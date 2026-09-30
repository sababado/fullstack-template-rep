# Architecture

## Runtime

```
Browser
  │  https://<distribution>.cloudfront.net (or your domain)
  ├──────────────► CloudFront ──(Origin Access Control)──► S3: the built web app
  │                  • security headers + CSP
  │                  • viewer-request function: app routes -> /index.html
  │
  │  sign-in (authorization code + PKCE)
  ├──────────────► Cognito managed login ──► access token (1 hour) + refresh token
  │
  │  https://<api-id>.execute-api.<region>.amazonaws.com, Authorization: Bearer <token>
  └──────────────► API Gateway (HTTP API)
                     • JWT authorizer checks the Cognito token (all routes but /health)
                     • CORS for the web app's origin
                     • throttling, access logs
                         │
                         ▼
                   Lambda: FastAPI (python3.14, arm64, SnapStart)
                     private subnets, no internet route
                         │                     │
                         ▼                     ▼
                   RDS PostgreSQL 18     Secrets Manager (via VPC endpoint)
                   (private)             DB credentials, rotated by RDS
```

- **Web app**: static files in a private S3 bucket, served only through CloudFront.
  Hashed assets are cached for a year; `index.html` revalidates on every load, so a
  deploy is visible immediately.
- **Auth**: Cognito hosts sign-in. The web app keeps tokens in session storage and
  sends the access token to the API. API Gateway verifies it before Lambda runs;
  the backend reads the verified claims (`core/auth.py`) and scopes data to the caller.
- **API**: one Lambda runs the whole FastAPI app. A second Lambda applies migrations and
  is invoked by the deploy workflow.
- **Database**: RDS PostgreSQL in private subnets, reachable only from the Lambda
  security group. The password lives in an RDS-managed secret that rotates on its own;
  the API reads it for each new connection.
- **Network**: the VPC has no NAT gateway, so Lambda can't reach the internet. It reaches
  Secrets Manager through an interface endpoint. Calling an outside API requires adding
  a NAT gateway or a VPC endpoint for that service.

## Locally

`npm run dev` runs the API (uvicorn, port 8000) and the web app (Vite, port 5173).
Vite proxies `/api/*` to the API, so there is no CORS locally. Postgres runs in Docker
(`docker compose up -d db`). Auth is off: `AUTH_MODE=local` on the API and
`VITE_AUTH_MODE=local` in the web app sign everyone in as one developer user. The API
refuses `AUTH_MODE=local` when `APP_ENV` is dev, staging, or prod.

## Environments and deploys

| Branch | Environment | Stacks |
| --- | --- | --- |
| `develop` | dev | `<slug>-frontend-dev`, `<slug>-backend-dev` |
| `staging` | staging | `<slug>-frontend-staging`, `<slug>-backend-staging` |
| `main` | prod | `<slug>-frontend-prod`, `<slug>-backend-prod` |

`.github/workflows/deploy.yml` deploys in this order:

1. **Hosting stack** (`apps/frontend/template.yaml`): bucket and CloudFront. Its URL is
   the web app's origin.
2. **Backend stack** (`apps/backend/template.yaml` and nested `infra/*.yaml`): network,
   database, Cognito, API. It receives the web app's origin for CORS and the Cognito
   callback URL.
3. **Migrations**: invokes the migrate Lambda; any error fails the deploy.
4. **Health check**: `/health` must report the commit just deployed.
5. **Web app**: built with the backend's outputs (API URL, Cognito settings), uploaded,
   and the CDN cache invalidated.

GitHub Actions gets AWS credentials through OIDC; no access keys are stored. The deploy
role can only manage this project's stacks and hands resource creation to a separate
CloudFormation execution role (`infra/bootstrap.yaml`).

## Observability

- Every request logs one JSON line (method, route template, status, duration, request ID).
  The request ID is returned in the `x-request-id` header and in error bodies.
- Alarms (to the SNS topic, and email if `ALERT_EMAIL` is set): Lambda errors, any
  logged `ERROR` line, API 5xx responses, migration failures, database CPU and storage.

## Rough monthly cost per environment (idle, us-east-1)

| Item | Cost |
| --- | --- |
| RDS db.t4g.micro, 20 GB gp3 (single-AZ; prod is Multi-AZ, about double) | ~$15 |
| Secrets Manager VPC endpoint in 2 AZs | ~$15 |
| Secrets Manager secret | ~$0.40 |
| Lambda, API Gateway, CloudFront, S3, Cognito | usage-based, near $0 at low traffic |

Check current prices before relying on these numbers.
