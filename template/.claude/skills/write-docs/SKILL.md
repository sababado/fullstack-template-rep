---
name: write-docs
description: "Update the docs and the changelog after a change, by running the scribe, scribe-changelog, and scribe-reviewer subagents in sequence. Run it after a feature or phase is built, or when docs have fallen behind the code. Pipeline step: run it when a person types the command or /offshore calls it, not for ordinary requests."
argument-hint: "<what changed: plan name, phase, PR number, or a description>"
model: sonnet
effort: medium
---

# Write docs

Update the docs and the changelog for:

$ARGUMENTS

The pipeline is three subagents in sequence. Run them in order and don't skip one: each
step needs the previous step's structured return. Each subagent's file sets its model
and tools, so pass only the inputs listed under **Provide**.

## Step 0: Check the branch

Run `git branch --show-current`. If it is `develop`, `staging`, or `main`, stop and ask
the user which branch to use; the scribes commit, and nothing is committed to those
branches. Record the base SHA: `git merge-base origin/develop HEAD`.

## Step 1: Scribe

Spawn the `scribe` subagent (Agent tool, `subagent_type: "scribe"`).

**Provide:**
- The request above, verbatim.
- The source material: the plan folder and phase docs, the PR number, or the changed
  paths, whichever the request points to.
- The branch and the base SHA.

It picks the doc tiers, writes or updates each doc, keeps `docs/feature-map.md`
current, commits, and returns `DOCS_CREATED`, `DOCS_UPDATED`, `CHANGELOG_HANDOFF`,
`COMMIT_SHAS`, `BRANCH`, `NOTES`. It never edits `CHANGELOG.md`; that is Step 2.

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/scribe.md` and apply it inline, and say in your report that it ran
inline.

## Step 2: Changelog (`scribe-changelog`)

Spawn the `scribe-changelog` subagent (Agent tool, `subagent_type: "scribe-changelog"`).

**Provide:**
- The scribe's `CHANGELOG_HANDOFF`, verbatim (even when it is `none — internal-only`;
  the reviewer verifies that claim).
- The areas the work touched (workspaces from `.claude/reference/project.md`).
- Story IDs (per "Story ID format" in `.claude/reference/tracker.md`) and the PR number,
  if any.
- The branch.

Pass no version level. This pipeline never bumps a version, creates a version heading,
or tags (`docs/VERSIONING.md`); releases are a person's decision. If `$ARGUMENTS` asks
for a version bump or a release, leave that part out and say so in the final report.

It adds entries under `## [Unreleased]` in `CHANGELOG.md`, prepend-only, commits, and
returns `CHANGELOG_UPDATED`, `ENTRIES`, `COMMIT_SHAS`, `BRANCH`, `NOTES`.

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/scribe-changelog.md` and apply it inline, and say in your report
that it ran inline.

## Step 3: Review (`scribe-reviewer`)

Spawn the `scribe-reviewer` subagent (Agent tool, `subagent_type: "scribe-reviewer"`).

**Provide:**
- The structured return from `scribe-changelog`.
- The structured return from `scribe`.
- The branch and the base SHA.

It is read-only. It checks entries under Unreleased only, section and wording,
prepend-only, links, references, no version bump or version heading, forbidden files,
the feature map, and that the returns match the diff. It returns:

```
STATUS: <pass | pass-with-warnings | fail | incomplete-input>
SUMMARY: <one sentence>
CHECKS: <per-check pass | warn | fail | n/a, with citations>
ACTIONABLE: <only the items to act on>
```

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/scribe-reviewer.md` and apply it inline, and say in your report
that it ran inline.

## Handling the review

- **`pass`:** done. Write the final report.
- **`pass-with-warnings`:** done. Put the warnings in the final report; they are
  informational.
- **`fail`:** send each `ACTIONABLE` item to the writer that owns the file:
  `CHANGELOG.md` to `scribe-changelog`, every other doc (including the feature map) to
  `scribe`. Spawn that writer again with the items and its previous return (same
  inline fallback as its step), then run Step 3 again with the updated returns. If the
  second review also returns `fail`, stop: report
  `NOTES: reviewer failed twice — manual intervention needed` with the `ACTIONABLE`
  list. Don't loop further.
- **`incomplete-input`:** your inputs were wrong. Fix them and run Step 3 again. This
  doesn't count as a failed round.

Items the scribe marked `needs a person` in NOTES (a decision conflict, an out-of-scope
request) go into the final report. Don't write those docs yourself.

## Final report

```
DOCS_CREATED: <from scribe>
DOCS_UPDATED: <from scribe>
CHANGELOG_UPDATED: <from scribe-changelog>
CHANGELOG_ENTRIES: <ENTRIES from scribe-changelog>
REVIEW_STATUS: <STATUS from scribe-reviewer>
REVIEW_NOTES: <ACTIONABLE and warnings, or "none">
COMMIT_SHAS: <every commit across the run>
BRANCH: <branch>
NOTES: <steps that ran inline, ignored version requests, needs-a-person items,
  "reviewer failed twice — manual intervention needed", or "none">
```

A calling skill (for example `/offshore`) reads this report, so keep the field names
exact. The commits are local; push only if the caller asked you to.
