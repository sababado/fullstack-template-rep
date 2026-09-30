# Daily workflow

## Start

```bash
git switch develop && git pull
npm ci                                 # when package-lock.json changed
(cd apps/backend && uv sync)           # when uv.lock changed
docker compose up -d db
(cd apps/backend && uv run alembic upgrade head)
npm run dev
```

## Branches

- Branch from `develop`: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- Open PRs into `develop`. `staging` and `main` receive promotions from `develop`.

## Common tasks

| Task | Command |
| --- | --- |
| Change the database schema | edit models, then `cd apps/backend && uv run alembic revision --autogenerate -m "..." --rev-id NNNN`; read the file; `uv run alembic upgrade head` |
| Undo the last migration locally | `uv run alembic downgrade -1` |
| Change the API | edit schemas and routes, then `npm run gen:api` and commit both outputs |
| Add a Python dependency | `cd apps/backend && uv add <pkg>` (or `uv add --dev <pkg>`), then `uv export --frozen --no-dev --no-emit-project -o src/requirements.txt` |
| Add a JS dependency | `npm install <pkg> -w @app/frontend` (or the workspace that needs it) |
| Format everything | `npm run format` and `cd apps/backend && uv run ruff format .` |
| Reset the local database | `docker compose down -v && docker compose up -d db`, then migrate |

## Before you push

Run the checks in [CLAUDE.md](../../../CLAUDE.md#done-means-verified). CI runs the same
ones; the `PR check` job must be green before merging.

## Pull in template updates

```bash
uvx copier update --trust
```

Resolve conflicts, then `npm install` and `(cd apps/backend && uv lock)`, and run the checks.
