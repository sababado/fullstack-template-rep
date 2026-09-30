# Changelog

Changes to the template itself. Generated projects pick them up with
`copier update`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions: [Semantic Versioning](https://semver.org/), tagged `vX.Y.Z`.

## [Unreleased]

### Added

- Copier template (`copier.yml` + `template/`) replacing the docs-only
  `template-project/` folder.
- Working skeleton: FastAPI backend (Python 3.14, SQLAlchemy 2.1, Alembic), React
  frontend (React 19, Vite 8, React Router 8, TanStack Query 5), UI kit (Tailwind 4,
  Storybook 10 with accessibility tests), and a shared TypeScript package, with a
  per-user notes feature as the worked example.
- AWS infrastructure (SAM): HTTP API with a Cognito JWT authorizer, Lambda (arm64,
  SnapStart), RDS PostgreSQL 18 in private subnets, S3 + CloudFront with a CSP, alarms,
  and a bootstrap stack for GitHub OIDC deploys.
- CI/CD for generated projects: PR checks with one gate job, branch-based deploys,
  CodeQL, dependency audit, Dependabot, optional Claude review.
- Documentation and agent rules for generated projects, plus an agent kit (skills,
  subagents, roles) with a tracker adapter for Linear, GitHub Issues, or no tracker.
- `/offshore` for unattended plan-to-PR runs, with a PreToolUse guardrail hook wired in
  `.claude/settings.json`, and model and effort tiers for every skill and subagent.
- `docs/CONTRIBUTING.md` in generated projects: contributing by hand and with the agent
  kit (setup per tracker, the pipeline, the teams, what people own, changing the kit).
- Template CI that renders the template and runs a generated project's checks.
