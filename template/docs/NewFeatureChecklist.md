# New feature checklist

Copy the relevant sections into the PR description or the plan's phase document.

## Plan

- [ ] The feature has a story (or stories) with acceptance criteria.
- [ ] Anything larger than one PR has a plan in `.implementation_plans/`.
- [ ] A decision that future contributors must respect has a record in `docs/decisions/`.

## Backend

- [ ] New feature folder under `src/features/<name>/` (schemas, service, router, models, errors).
- [ ] Request schemas extend `BaseSchema`; text uses `ShortString`/`MediumString`/`LongString`.
- [ ] Column lengths reuse the constants from `core/schemas/validators.py`.
- [ ] Routes declare `response_model` and `responses=ERROR_RESPONSES`.
- [ ] Non-public routes depend on `CurrentPrincipal`; queries are scoped to the caller;
      other users' rows return 404.
- [ ] Errors the UI reacts to have their own code (`FEATURE_THING_REASON`).
- [ ] Migration generated with `--rev-id`, read by hand, and reversible (`downgrade`).
- [ ] Unit tests for logic; integration tests through the HTTP client, including another
      user trying to reach the data.

## Frontend

- [ ] `npm run gen:api` run and the output committed.
- [ ] Feature folder under `src/features/<name>/` with an `index.ts`; the page is a lazy route.
- [ ] Loading, error (with retry), and empty states.
- [ ] Field errors from the API shown next to their fields.
- [ ] Every string in `locales/en/<namespace>.ts`; new error codes in `errors.ts`.
- [ ] Built from UI kit components with semantic tokens; missing components added to the kit.
- [ ] Tests with `renderApp` + `mockApi`, querying by role and name.

## Accessibility

- [ ] One `h1` per page; headings in order.
- [ ] Every control has a visible label or an `aria-label`.
- [ ] Works with the keyboard alone; focus is visible.
- [ ] New UI kit components have stories (the story tests run axe).

## Security and privacy

- [ ] No secrets in code, config files, or logs.
- [ ] Personal data is collected only when needed and never logged.
- [ ] New exceptions to [SECURITY.md](SECURITY.md) are recorded in its exceptions table.

## Operations

- [ ] Errors that need a person's attention are logged at `ERROR` (they alarm).
- [ ] New AWS resources have alarms where a failure would go unnoticed.
- [ ] Docs updated: feature map, area guide, runbook if operations change.
