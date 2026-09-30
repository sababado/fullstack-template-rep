# Fullstack template: rules for AI agents

This repository is a Copier template. You're changing the **template**, not an app.
Everything under `template/` is copied into generated projects; files ending in `.jinja`
are rendered with the answers from `copier.yml`, and file or folder names can contain
Jinja too (for example `{% if tracker == "linear" %}.mcp.json{% endif %}`).

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first change. The generated
project's own rules are in `template/CLAUDE.md.jinja` and `template/.claude/`; they
describe the projects this template produces, not this repository.

## The loop

1. Edit files under `template/` (or `copier.yml`).
2. Render a sample project: `scripts/dev-render.sh ../fullstack-sample`
   (first time: `cd ../fullstack-sample && npm ci && (cd apps/backend && uv sync)`).
3. Run the sample's checks (its `CLAUDE.md` lists them; the integration tests need
   Postgres and `TEST_DATABASE_URL`).
4. If formatters or `uv lock`/`npm install` changed files in the sample, copy them back:
   `python scripts/sync_back.py ../fullstack-sample [--lockfile]`.
5. Check the rendered output: `python scripts/check_render.py ../fullstack-sample`.
6. For changes that depend on answers, render the other variants too
   (`-d tracker=linear -d tracker_key=ACME`, `-d tracker=none`,
   `-d include_claude_review=false`).

## Rules

- **Edit the source, never the sample.** A fix made only in the sample is lost on the
  next render. `sync_back.py` skips rendered files for this reason.
- **Keep files static unless they need an answer.** Only add `.jinja` when a file must
  contain a project value; everything the agent kit needs comes from
  `template/.claude/reference/project.md.jinja` and `tracker.md.jinja`.
- **Inside `.jinja` files**, wrap GitHub Actions expressions (`${{ ... }}`) in
  `{% raw %}...{% endraw %}`, and make sure rendered values still pass Prettier and ruff
  (quotes in names, for example).
- **Lockfiles are part of the template.** After changing dependencies, run
  `npm install` / `uv lock` in the sample, then `sync_back.py --lockfile` (the root
  `package-lock.json` is templated) and commit both lockfiles.
- **Versions:** new dependencies use the latest release that works with the rest of the
  stack; record exceptions (like TypeScript 6 instead of 7) in
  `template/docs/decisions/0001-stack-choices.md`.
- **Generated projects must pass their own CI.** `.github/workflows/template-ci.yml`
  renders the template and runs the full suite; keep it green.
- Record user-visible template changes in [CHANGELOG.md](CHANGELOG.md) under `Unreleased`.
- Don't push to `main`; open a PR.
