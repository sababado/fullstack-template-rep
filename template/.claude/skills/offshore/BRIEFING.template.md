# Offshore briefing: <plan title>

**Date:** <date>
**Result:** <COMPLETE | STOPPED: one-line reason>
**Feature branch:** `feature/<plan>`
**PR into develop:** #<N>, green, open for your review (not merged) | none: <reason>
**Phases done:** <N> of <total>
**Environment:** Docker <ready | unavailable>, GitHub <MCP tools | gh | none>, jq <yes | no>

> **Your next step:** review PR #<N>, work through the by-story steps in `MANUAL_QA.md`,
> and merge when you're satisfied. The run never merges and never runs the manual QA:
> both are your gate.
>
> If you started the run with `/loop`, stop the loop now (Esc, or "stop the loop"). Later
> fires do nothing, but there's no reason to keep them running.

---

## Run health

| Metric | Value |
| --- | --- |
| Total run time | <Xh Ym> |
| Sub-agent retries | <count, or 0> |
| Guardrail blocks | <count of BLOCK lines in `.offshore/guardrails.log`, or 0> |
| Phase review rounds | <total across phases> |
| PR review rounds | <N> |
| Commits on the branch | <N> (target: phases + 4 + PR rounds, plus at most 2) |

## Phases

| Phase | Title | Status | Commit | Review rounds | Time |
| --- | --- | --- | --- | --- | --- |
| phase-1-<slug> | <title> | Done | `<sha>` | 2 | 41m |
| phase-2-<slug> | <title> | Blocked (see below) | parked on `offshore/<plan>/phase-2-<slug>` | 0 | 18m |
| phase-3-<slug> | <title> | Skipped: depends on phase-2 | — | — | — |

## Decisions made

- **<topic>:** chose <X> over <Y> because <reason>. See `<path>:<line>`.

## Plan amendments

- **<phase-id> (new):** split from <phase-id> because <reason>.
- **<phase-id> amended:** <what prep changed and why>.

## Deferrals and blockers

- **<item>:** <context in one or two sentences>. Options: (a) ... (b) ... Recommendation: ...
  Earlier attempt: `git log --oneline origin/develop..offshore/<plan>/<phase-id>`.

## Skipped for the environment

- **<suite>:** skipped because <reason>. Run it with: `<command>`.

## Integration gate

- Result: <clean | fixes applied | stuck>
- Failures found and fixed: <list, or "none">
- Passing tests: <count per workspace; "skipped" for a suite that didn't run>

## Review summary

- Phase reviews: <per phase: rounds and final verdict, APPROVED or CHANGES REQUESTED>
- PR review: <clean | skipped: reason | none (no review workflow) | issues remaining>
- Findings fixed: <N>. Answered without a change: <N>. Deferred: <N>, listed above.

## Rollback

Each phase and each PR review round is one commit on the feature branch, so one revert
undoes one unit:

```bash
git log --oneline origin/develop..feature/<plan>
git revert <sha>
```

If the branch has far more commits than the target in Run health, a squash step was
skipped (see "Squash recipe" in `.claude/skills/offshore/SKILL.md`).

## Action items for you

- [ ] Review PR #<N> into develop, especially <the riskiest change, with a path and lines>.
- [ ] Work through `MANUAL_QA.md`.
- [ ] <each blocked, review-stuck, or skipped phase, and what it needs from you>
- [ ] <Docker, jq, or GitHub access problems; leftover stashes; doc regressions>

<!--
Briefing rules. Keep them: the person reads this first thing.

- No essays. Each bullet is one or two sentences.
- Every section stays, even when empty: write "None". This matters most for Decisions
  made, Deferrals and blockers, and Skipped for the environment.
- Run health is mandatory. If everything went smoothly, say so.
- Action items are specific and checkable. Not "review the code", but "Review PR #42,
  especially the ownership check in `apps/backend/src/features/notes/service.py:85-120`".
- Report what happened, from the checkpoint and the logs. Never estimate a number.
-->
