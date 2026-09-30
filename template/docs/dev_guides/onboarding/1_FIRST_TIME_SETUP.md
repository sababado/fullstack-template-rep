# First-time setup

About 15 minutes on a fresh machine. No AWS account is needed for local work.

## 1. Install tools

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | 24 (see `.nvmrc`; `nvm use` picks it up) | `node --version` |
| uv | 0.12 or later ([install](https://docs.astral.sh/uv/getting-started/installation/)) | `uv --version` |
| Docker | any recent version, for local Postgres | `docker compose version` |
| AWS CLI + SAM CLI | only for deploying from your machine | `aws --version`, `sam --version` |

uv installs the right Python (3.14) for the backend on its own.

## 2. Install dependencies

```bash
npm ci
cd apps/backend
uv sync
cp .env.example .env
cd ../..
```

## 3. Start the database and apply migrations

```bash
docker compose up -d db
(cd apps/backend && uv run alembic upgrade head)
```

## 4. Run the app

```bash
npm run dev
```

- Web app: http://localhost:5173 (you're signed in as the local developer)
- API docs: http://localhost:8000/docs

## 5. Run the checks

```bash
npm run lint && npm run typecheck && npm test
cd apps/backend
uv run ruff check . && uv run mypy && uv run lint-imports
TEST_DATABASE_URL=postgresql+asyncpg://app:app@localhost:5432/app_test uv run pytest
```

The integration tests create the `app_test` database the first time and rebuild its
schema on every run. They refuse any database whose name doesn't end in `_test`.

For the UI kit's browser tests, install Chromium once, then run them:

```bash
npx playwright install chromium
npm run test:stories -w @app/ui-kit
```

## 6. Optional: Storybook

```bash
npm run storybook   # http://localhost:6006
```

## Where things live

- [README.md](../../../README.md): layout and commands
- [docs/architecture.md](../../architecture.md): how the system fits together
- [docs/CONTRIBUTING.md](../../CONTRIBUTING.md): how changes are made, including with AI agents
