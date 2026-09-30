# Contributing to the template

This repository produces projects; a change is only good if the projects it
generates still build, pass their checks, and deploy. Read this, then
[CLAUDE.md](CLAUDE.md) if you work with an AI agent.

## How the repository works

- `copier.yml` defines the questions and Copier settings.
- `template/` is copied into every generated project. Files ending in `.jinja` are
  rendered with the answers (and lose the suffix); other files are copied as-is. Names
  can be templated too: `{% if include_claude_review %}claude-review.yml{% endif %}`
  only exists when that answer is yes.
- `scripts/` holds the development tools below.
- `.github/workflows/template-ci.yml` renders the template with several answer sets and
  runs a generated project's full check suite.

## Setup

You need [uv](https://docs.astral.sh/uv/) 0.12+, Node 24, and Docker (or a local
Postgres) for the integration tests.

## The development loop

```bash
# 1. Render the working copy (uncommitted changes included) into a sample project
scripts/dev-render.sh ../fullstack-sample
cd ../fullstack-sample && npm ci && (cd apps/backend && uv sync) && cd -

# 2. Edit template/..., then re-render (node_modules and .venv are kept)
scripts/dev-render.sh ../fullstack-sample

# 3. Run the sample's checks
cd ../fullstack-sample
npm run lint && npm run typecheck && npm test && npm run build
npm run test:stories -w @app/ui-kit
(cd apps/backend && uv run ruff check . && uv run mypy && uv run lint-imports \
  && TEST_DATABASE_URL=postgresql+asyncpg://app:app@localhost:5432/app_test uv run pytest)
cd -

# 4. Bring formatter output and lockfile changes back into template/
python scripts/sync_back.py ../fullstack-sample --lockfile

# 5. Check the rendered output for leftover Jinja and wrong optional files
python scripts/check_render.py ../fullstack-sample
```

Copier doesn't delete files you removed from the template; delete them from the sample
by hand, or render into a fresh directory.

When a change depends on an answer, render the variants too:

```bash
scripts/dev-render.sh ../sample-linear -d tracker=linear -d tracker_key=ACME -d include_claude_review=false
scripts/dev-render.sh ../sample-none -d tracker=none -d "project_name=Bob's Lab"
```

## Rules for template files

- Edit files in `template/`, never in a rendered sample.
- Add `.jinja` only when a file needs an answer. Prefer reading project facts from one
  rendered file (the agent kit reads `template/.claude/reference/project.md.jinja` and
  `tracker.md.jinja`) over templating many files.
- In `.jinja` files, wrap GitHub Actions `${{ ... }}` expressions in
  `{% raw %}...{% endraw %}`.
- Rendered output must pass the project's formatters and linters for any valid answer.
  Test values with quotes and backslashes when you render a name into code.
- `template/package-lock.json.jinja` is the real lockfile with the root package name
  templated. Regenerate it with `scripts/sync_back.py <sample> --lockfile` after
  `npm install` in the sample; never edit it by hand.

## Adding a Copier question

1. Add it to `copier.yml` with `help`, a sensible `default`, and a `validator`.
2. Use it in the fewest files possible.
3. Add a render variant for it in `.github/workflows/template-ci.yml`, and teach
   `scripts/check_render.py` about any file that should appear or disappear.
4. Document it in the question table in [README.md](README.md).

Renaming or removing a question breaks `copier update` for existing projects; add a
[migration](https://copier.readthedocs.io/en/stable/configuring/#migrations) instead.

## Upgrading dependencies

Use the newest release that works with the rest of the stack. Upgrade in the sample,
run every check, sync the lockfiles back, and record any version you deliberately held
back (and why) in `template/docs/decisions/0001-stack-choices.md`.

## Changing the agent kit

The agent kit (`template/.claude/`) is for generated projects. To test a change,
render a sample, open it in Claude Code, and run the skill you changed there (for
example `/plan-tech` on a small feature). Keep kit files free of project-specific
facts: those belong in `reference/project.md.jinja` or `reference/tracker.md.jinja`.
The generated project's `docs/CONTRIBUTING.md` explains the kit to its users; update it
when the kit's skills or teams change.

## Pull requests

- Branch from `main`; open a PR. Template CI must pass.
- Add a line to [CHANGELOG.md](CHANGELOG.md) under `Unreleased` for any change a
  generated project would notice.
- Describe how you verified the change (which variants you rendered and which checks ran).

## Releasing a template version

1. Move `Unreleased` entries under `## [X.Y.Z] - YYYY-MM-DD` in `CHANGELOG.md`.
2. Merge to `main` and tag: `git tag -a vX.Y.Z -m "X.Y.Z" && git push origin vX.Y.Z`.

`copier copy` and `copier update` use the latest tag by default, so projects only
receive tagged versions. Breaking changes (renamed files, removed questions) bump the
major version and come with notes on how to update.
