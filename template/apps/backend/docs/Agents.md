# Backend guide (`apps/backend`)

FastAPI on AWS Lambda behind API Gateway (HTTP API). Python 3.14, SQLAlchemy 2.1
(async, asyncpg), Alembic, Pydantic 2, managed with uv.

## Layout

```
src/
  app.py               create_app() and the Lambda handler
  core/                The kernel. Never imports features.
    config.py          Settings from env vars; the only place env is read
    database.py        Engine, get_session (one transaction per request)
    errors.py          AppError hierarchy and the error envelope
    auth.py            Principal, CurrentPrincipal, require_group
    schemas/           BaseSchema, ShortString/LongString, sanitize_html
    models.py          Base (naming convention), TimestampMixin
    middleware.py      Request ID, request log line, last-resort 500
    logging.py         logger (structured JSON)
    secrets.py         Secrets Manager reads with a TTL cache
  features/<name>/     One vertical slice per feature
    router.py          HTTP layer: parse, call the service, return a schema
    schemas.py         Request and response models (the API contract)
    service.py         Business logic; takes a session and the caller
    models.py          Tables
    errors.py          Feature error codes (AppError subclasses)
  handlers/            Non-HTTP Lambdas (migrate.py)
  migrations/          Alembic
tests/unit/            No database
tests/integration/     Real Postgres, each test in a rolled-back transaction
```

`import-linter` enforces two rules: `core` never imports `features` or `handlers`,
and features never import each other. Shared logic goes in `core`.

## Adding a feature

1. Create `src/features/<name>/` with `schemas.py`, `service.py`, `router.py`, and
   `models.py` and `errors.py` if needed. Copy the shape of `features/notes/`.
2. Write the schemas first: they are the contract the frontend is generated from.
3. Register the router in `create_app()` in `src/app.py`.
4. If you added tables: `uv run alembic revision --autogenerate -m "add widgets" --rev-id NNNN`
   (next number), then read the generated file and fix anything autogenerate got wrong.
5. Add unit tests for pure logic and integration tests through the HTTP client.
6. Run `npm run gen:api` from the repo root and commit `openapi.json` and the frontend types.
7. Add a row to [docs/feature-map.md](../../../docs/feature-map.md).

## Rules

### API contract

- Every route declares `response_model` and returns a schema, never a dict or an ORM object.
- Routers pass `responses=ERROR_RESPONSES` so the error shape is in the OpenAPI document.
- Route function names become `operationId`s and the frontend's method names; name them
  as verbs (`list_notes`, `create_note`).

### Errors

- Services raise `AppError` subclasses. Define a feature-specific one when the frontend
  should react to it: `class NoteNotFoundError(NotFoundError): code = "NOTE_NOT_FOUND"`.
- Codes are `UPPER_SNAKE_CASE`, stable, and translated on the frontend in
  `apps/frontend/src/core/i18n/locales/en/errors.ts`.
- Never put exception text in a response. Unexpected exceptions return a generic 500 with
  the request ID; the details go to the logs.

### Validation and security

- Request schemas extend `BaseSchema`: whitespace trimmed, unknown fields rejected.
- Text fields use `ShortString` (required), `MediumString`, or `LongString`; these strip
  HTML and enforce the same limits as the columns. Reuse the constants in
  `core/schemas/validators.py` for the column lengths.
- Every route that isn't public depends on `CurrentPrincipal`. Scope every query to
  `principal.sub` (or a tenant/owner column) in the service, and return 404, not 403,
  for rows the caller doesn't own.
- Group-restricted routes add `dependencies=[require_group("admin")]`.
- See [docs/SECURITY.md](../../../docs/SECURITY.md).

### Database

- One transaction per request: `get_session` commits when the route returns and rolls
  back if it raises. Services call `session.flush()` when they need generated values,
  never `commit()`.
- Don't share a session between concurrent tasks (`asyncio.gather` on one session breaks).
- Constraint names come from the naming convention in `core/models.py`; don't name them
  by hand.
- Never edit a migration that has run anywhere. Write a new one.
- `tests/integration/test_migrations.py` fails if models and migrations disagree, and
  `tests/unit/test_migration_history.py` fails if there are two migration heads.

### Lambda

- Do no I/O at import time: no connections, no AWS calls, no reading secrets. The engine
  and boto3 clients are created on first use. This keeps SnapStart snapshots clean.
- A non-API Lambda that uses `asyncio.run()` must `await dispose_engine()` before the
  loop closes: asyncpg connections belong to the loop that opened them.
- Lambdas run in private subnets with no internet access. Reaching a new AWS service
  needs a VPC endpoint in `infra/network.yaml`; reaching the internet needs a NAT gateway.

### Logging

- `from core.logging import logger`, then `logger.info("Note created", extra={"note_id": ...})`.
  Put data in `extra`, not in the message.
- Never log secrets, tokens, or personal data (emails, names, free text a user typed).
- An `ERROR` log line triggers an alarm in AWS. Use it for things someone should look at.

## Testing

- `uv run pytest -m "not integration"` runs the fast suite without a database.
- Integration tests use `TEST_DATABASE_URL` (the database name must end in `_test`; the
  suite drops and recreates its schema), or start a Postgres container when Docker is
  available.
- Fixtures: `client` (HTTP client with the session overridden), `session`,
  `act_as("user-b")` to switch the caller.
- Coverage floor: `fail_under` in `pyproject.toml`. Raise it as coverage grows; never lower it.

## Verifiability checklist

Run these before calling backend work done:

```bash
uv run ruff check . && uv run ruff format --check .
uv run mypy
uv run lint-imports
uv run pytest --cov
uv export --frozen --no-dev --no-emit-project -o src/requirements.txt   # after dependency changes
```

From the repo root after an API change: `npm run gen:api`, then commit
`apps/backend/openapi.json` and `apps/frontend/src/core/api/schema.d.ts`.
