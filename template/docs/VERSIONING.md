# Versioning and releases

The product has one version, in the root `package.json`, following
[Semantic Versioning](https://semver.org/):

- **MAJOR**: a breaking change for users or API clients.
- **MINOR**: new, backward-compatible functionality.
- **PATCH**: fixes and internal improvements.

Before 1.0.0, breaking changes may ship in a minor version.

## Changelog

[CHANGELOG.md](../CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com/).
Every user-visible change adds a line under `## [Unreleased]` in the same PR, in the
right section (Added, Changed, Deprecated, Removed, Fixed, Security). Internal-only
changes (refactors, CI, tests) don't need an entry.

Edit the changelog by adding lines near the top; never rewrite or reorder older entries.

## Cutting a release

A person decides when to release and which part of the version to bump.

1. Move the `Unreleased` entries under a new `## [X.Y.Z] - YYYY-MM-DD` heading.
2. Set `"version"` in the root `package.json` to `X.Y.Z` and run `npm install` to update
   the lockfile.
3. Commit `chore: release X.Y.Z`, merge it to `main`, and tag it:
   `git tag -a vX.Y.Z -m "X.Y.Z" && git push origin vX.Y.Z`.

The deployed commit SHA is reported by the API's `/health` endpoint and baked into the
web app, so you can always tell which build is running.

## Rules for AI agents

- Add changelog entries under `Unreleased`; never create a version heading.
- Never bump the version or create tags. Releases are a person's decision.
