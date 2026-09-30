# Fullstack template

A [Copier](https://copier.readthedocs.io/) template for full-stack web apps on AWS:
a React web app, a FastAPI API on Lambda, PostgreSQL, Cognito sign-in, CI/CD with
GitHub Actions, and rules plus an agent workflow for building features with AI agents.

Every generated project runs, passes its own checks, and deploys on day one. It
includes one worked example feature (per-user notes) that shows each convention in
real code; replace it with your own.

## Generate a project

You need [uv](https://docs.astral.sh/uv/), Node 24, and Docker.

```bash
uvx copier copy --trust gh:sababado/fullstack-template-rep my-app
```

Copier asks for:

| Question | Used for |
| --- | --- |
| Project name, slug, description | Titles, AWS stack/resource names, package names |
| GitHub repository (`owner/name`) | The AWS deploy role trusts only this repository |
| Code owner | `CODEOWNERS` for infrastructure, CI, migrations, auth, and agent rules |
| AWS region | Where the stacks deploy |
| Issue tracker: Linear, GitHub Issues, or none | The planning workflow, PR template, and commit conventions. With "none", stories live in `.implementation_plans/<plan>/STORIES.md` |
| Automated Claude PR review | Adds `.github/workflows/claude-review.yml` |

Then follow the generated project's `docs/dev_guides/onboarding/1_FIRST_TIME_SETUP.md`.

## Keep a project up to date

```bash
cd my-app
uvx copier update --trust
```

Copier replays the saved answers (`.copier-answers.yml`) against the newest template
version and merges the changes into your project. Tag template releases
(`vX.Y.Z`) so projects update to known versions.

## What you get

| Area | Contents |
| --- | --- |
| Web app | React 19, Vite 8, React Router 8, TanStack Query 5, react-i18next (ICU, typed keys), TypeScript 6, API client generated from the backend's OpenAPI contract, Cognito sign-in (code + PKCE) |
| Design system | Tailwind 4 tokens with dark mode, Radix + cva components, Storybook 10; every story runs as a browser test with axe accessibility checks |
| API | Python 3.14, FastAPI, SQLAlchemy 2.1 async, Alembic, one error envelope for every failure, request IDs and structured logs, per-caller data scoping, import boundaries enforced by import-linter |
| Tests | pytest (unit + integration against real Postgres, isolated by transaction), Vitest, coverage floors in every workspace, a contract test between frontend limits and the API schema |
| AWS | SAM: HTTP API + JWT authorizer, Lambda (arm64, SnapStart), RDS PostgreSQL 18 in private subnets, Secrets Manager rotation, S3 + CloudFront with CSP, alarms; a bootstrap stack for GitHub OIDC deploys |
| CI/CD | PR checks with one required gate job, branch-based deploys (develop/staging/main), CodeQL, dependency audit, Dependabot |
| AI agents | `CLAUDE.md` rules, per-area `Agents.md` guides with verification checklists, decision records, implementation-plan conventions, and an agent workflow (see `docs/CONTRIBUTING.md` in a generated project) |

The reasoning behind the main choices is in
[template/docs/decisions/0001-stack-choices.md](template/docs/decisions/0001-stack-choices.md).

## Repository layout

```
copier.yml        Questions and Copier settings
template/         The project template (files ending in .jinja are rendered)
.github/          CI for the template itself: generates projects and runs their checks
CONTRIBUTING.md   How to change the template
```

## Contributing to the template

See [CONTRIBUTING.md](CONTRIBUTING.md).
