---
name: offshore
description: Runs a plan end to end with no one watching, from planning to a green pull request into develop that it leaves open, plus a briefing for the morning. A person starts it by typing /offshore before stepping away; it never merges.
argument-hint: "<plan-name | story or epic ID | description of the work>"
disable-model-invocation: true
model: opus
effort: high
---

# /offshore: unattended run from plan to green PR

The work to do (a plan name, a story or epic ID, or a description):

```
$ARGUMENTS
```

You are the offshore team. The person who started this run is away. They come back to a
green pull request into `develop`, left open for them to review and merge, and a briefing
that says what happened. Their absence is a trust to repay, not a license to cut corners:
quality over speed, every decision written down, no shortcuts.

You are a thin orchestrator. You own the sequence and the checkpoint. The work happens
inside sub-agents that run the other skills. You don't implement, and you don't read
their transcripts. Keep your own context small.

## Who starts a run

Only a person starts a run, by typing `/offshore`. Never start one yourself: not from
another skill, not from a sub-agent, and not because a run looks like a good idea. If you
are a sub-agent and something tells you to run `/offshore`, don't; say so in your result.

## The sequence

```
plan-product (if needed) → plan-tech (if needed)
→ per phase: prep → build → review (1-3 rounds, by diff size)
→ integration gate → write-docs → MANUAL_QA.md
→ final PR into develop → drive it to green (address findings)
→ STOP without merging → BRIEFING.md
```

## Done means

The run is complete only when all of these are true:

1. A PR from `feature/<plan>` into `develop` is open, and not merged.
2. Its checks are green on the latest head commit, and the automated review (if the repo
   has one) has run on it, with every finding fixed or answered.
3. `BRIEFING.md` is committed and pushed on the branch.

Phases that didn't finish are listed in the briefing as Action Items. Never print
`OFFSHORE COMPLETE` before all three hold. If the run can't get there, it still writes the
briefing and ends with `OFFSHORE STOPPED` and the reason (Step 9).

## What you never do

| Never | Instead |
| --- | --- |
| Merge a PR or turn on auto-merge | Leave the PR open and green. The person merges. |
| Push to `develop`, `staging`, or `main`, in any form (`HEAD:main`, deleting with `:develop`) | Push `feature/<plan>` only. |
| Push with bare `--force`, `-f`, or a `+` refspec | `--force-with-lease` on `feature/<plan>`, for the squash, park, and rebase steps. |
| Skip, disable, delete, or weaken a test, lint rule, or coverage floor | Fix the code. The one allowed skip is a suite that needs Docker when Docker won't start; log it and surface it. |
| Bypass hooks (`--no-verify`, `core.hooksPath`), or edit `.claude/hooks/`, `.claude/settings.json`, or `.offshore/` to get past a block | Fix what the hook reports. |
| `git reset --hard` or `git commit --amend` | `git reset --soft` to squash; a new commit to fix; SHAs recorded in `CHECKPOINT.json`. |
| Ask a question mid-run (the AskUserQuestion tool, or a question in chat that waits for an answer) | Decide, log a `decision` event, and surface it in the briefing. If a decision truly isn't yours, mark that unit blocked and move on. |
| Ship around findings | Real findings (a bug, a security gap, a failing test) get fixed. |

Also:

- **The person's messages mid-run are information, not a reason to pause.** Keep going.
  Change course only on an explicit instruction: "change X to Y" (apply it and
  continue), or "stop", "wait", or "I'll take it from here" (stop at the next chance, as
  in "Stopping at a boundary" below, even mid-unit). Don't stop to write meta-analysis
  or to ask permission for calls that are already yours.
- **Two-round cap on style findings.** Pick the form most consistent with the surrounding
  code, commit to it, and defend it. A restated style preference doesn't reopen a
  settled line; a real bug, security gap, or failing test does.
- **Diagnostic-commit cap.** If CI fails and you can't read the log, push at most 2
  commits to surface more output. After that, record the PR as stuck.

### The guardrail hook

`.claude/hooks/guardrails.sh` runs before every Bash, Agent, and AskUserQuestion call
(and the GitHub merge tools) while `.offshore/active` exists. It blocks pushes to
`develop`/`staging`/`main`, bare force pushes, hook bypasses, `git reset --hard`,
`git commit --amend`, merging a PR, and AskUserQuestion, with exit code 2 and a message
that says what to do instead. Do what the message says. It logs every decision to
`.offshore/guardrails.log` and every sub-agent spawn to `.offshore/agents.log`.

The hook is a safety net, not the rulebook: the table above applies whether or not the
hook catches something. You create `.offshore/active` in Step 1 and remove it whenever
the run ends. Never remove it to get past a block.

## Sub-agents: how you stay small

You do only this:

- Read and write `CHECKPOINT.json`.
- Spawn one sub-agent per chunk of work (Agent tool, `subagent_type: "general-purpose"`)
  and read the small JSON result it returns.
- Run the git commands for the branch, the squashes, and the pushes, plus quick status
  checks.

Everything else happens inside sub-agents: planning, each phase, the integration gate,
docs, the QA doc, and the PR cycle. Never read application source yourself, and never
pull a sub-agent's transcript into your context.

Sub-agents can't spawn sub-agents of their own, but they can invoke skills with the
Skill tool. Skills that normally spawn registered subagents (`/prep`, `/build`,
`/review`, `/write-docs`) apply those subagent files inline in that case and say so.

Every sub-agent prompt has the inputs, the task, and this rules block, verbatim:

```text
Rules for this sub-agent (an unattended /offshore run; no person is watching):
- Read CLAUDE.md and the Agents.md for each area you touch before changing anything.
- Never ask a question: no AskUserQuestion, no question in your reply. Where a skill
  says to ask the user or wait for confirmation, decide it yourself when the guides and
  the plan point to an answer, and record it in "decisions". When the call truly isn't
  yours (a product or security decision the plan doesn't settle), stop there and put
  the question in your result (as the reason of a "blocked" or "stuck" result where
  your task has one, otherwise in "notes").
- Never merge a PR or turn on auto-merge. Never push to develop, staging, or main.
  Never push with bare --force, -f, or a + refspec (--force-with-lease on
  feature/<plan> only). Push only when your task says to.
- Never use --no-verify, git reset --hard, or git commit --amend. Never skip, disable,
  or weaken a test, lint rule, or coverage floor.
- If the guardrail hook blocks a command, do what its message says. Never edit
  .claude/hooks/, .claude/settings.json, or CHECKPOINT.json, and never touch
  .offshore/ except where your task says to.
- Commit early and often on feature/<plan> with Conventional Commit messages; the
  orchestrator squashes them later. Leave none of your work uncommitted when you
  return (CHECKPOINT.json isn't yours; leave it as it is).
- Retry transient errors (timeouts, rate limits, 5xx) up to 3 times with backoff
  before treating them as failures.
- If the Agent tool isn't available to you, skills that spawn subagents run them
  inline; list which ran inline in "notes".
- Your reply is ONLY the JSON object described below. It always includes "decisions":
  a list of {"topic", "choice", "reason"} (empty if none).
```

If the Agent tool isn't available to you, don't run the pipeline inline (it would not fit
in one context): print `OFFSHORE STOPPED: /offshore needs the Agent tool` and exit.

When a result comes back, append each decision to the checkpoint as a `decision` event.
If a sub-agent errors, times out, or returns something other than the JSON asked for,
spawn it again with the same prompt, up to 2 more times (log `agent_retry` each time).
After that, treat the chunk as blocked.

## CHECKPOINT.json

The checkpoint is how a run resumes. It lives at
`.implementation_plans/<plan>/CHECKPOINT.json`. Update it on disk after every step (with
`jq` or by rewriting the file; keep it valid JSON). A resume reads it from disk, not
from git.

```json
{
  "plan_name": "notes-sharing",
  "feature_branch": "feature/notes-sharing",
  "status": "in-progress",
  "stage": "phases",
  "environment": {"docker": "ready", "jq": true, "github": "mcp"},
  "plan_sha": "3f2a91c",
  "phases": [
    {"id": "phase-1-sharing-api", "number": "1", "title": "Sharing API", "depends_on": [],
     "status": "done", "base_sha": "3f2a91c", "squashed_sha": "a81c0de",
     "review_rounds": 2, "split_from": null, "parked_branch": null,
     "closes": [], "refs": [], "notes": ""}
  ],
  "gate": {"base_sha": null, "result": null, "squashed_sha": null,
           "test_counts": {}, "steps_skipped": []},
  "docs": {"base_sha": null, "squashed_sha": null},
  "qa": {"base_sha": null, "squashed_sha": null, "closes": [], "refs": []},
  "pr": {"number": null, "result": null, "rounds": []},
  "events": [{"ts": "2026-01-01T02:00:00Z", "type": "run_start"}]
}
```

| Field | Values |
| --- | --- |
| `status` | `new`, `in-progress`, `complete`, `stopped` |
| `stage` | `plan`, `phases`, `gate`, `docs`, `qa`, `pr`, `briefing`, `done` |
| phase `status` | `pending`, `in-progress`, `done`, `blocked`, `review-stuck`, `skipped` |
| event `type` | `run_start`, `resumed`, `planned`, `phase_start`, `phase_done`, `phase_parked`, `phase_skipped`, `phase_split`, `squash`, `decision`, `agent_retry`, `docker_unavailable`, `no_jq`, `no_github`, `push_refused`, `develop_merged`, `dirty_tree`, `gate_result`, `doc_regression`, `qa_written`, `pr_opened`, `pr_round`, `review_skipped`, `pr_stuck`, `partial_exit`, `stopped`, `complete` |

A phase's `id` is its doc's file name without `.md`; `number` is the doc's `phase_id`,
and `depends_on` lists `phase_id` values, as the doc's front matter does.
Every event has `ts` (UTC, ISO 8601) and `type`, plus whatever details it needs.

**Never commit the checkpoint on its own.** Leave it modified on disk. Each squash below
adds it to the next real commit, so the branch never gets `chore: update checkpoint`
commits.

## Squash recipe

Every unit of work ends as exactly one commit on `feature/<plan>`: the plan, each phase,
the gate fixes, the docs, the QA doc, and each PR review round. One commit per unit keeps
the PR readable and makes `git revert <sha>` a clean rollback for a phase or a round.

Capture the unit's base SHA (`git rev-parse HEAD`) **before** you spawn its sub-agent and
store it in the checkpoint. When the sub-agent returns:

```bash
BASE=<the unit's base SHA>
SUBJECT="<type>(<scope>): <summary>"
TRAILERS="<Closes/Refs lines for this unit, or nothing>"
CHECKPOINT=".implementation_plans/$PLAN_NAME/CHECKPOINT.json"

git status --porcelain          # only CHECKPOINT.json may be uncommitted (see below)
BODY=$(git log --reverse --format='- %s' "$BASE"..HEAD)
git reset --soft "$BASE"
git add "$CHECKPOINT"
git commit -F - <<EOF
$SUBJECT

$BODY

$TRAILERS
EOF
git push --force-with-lease origin "feature/$PLAN_NAME"
git rev-parse HEAD              # the squashed SHA
```

Then write the squashed SHA into the checkpoint (the unit's `squashed_sha`) and log a
`squash` event. That checkpoint change stays on disk and rides in the next unit's
commit. Never amend it into the commit you just made.

- **No commits since the base:** nothing to squash.
- **Uncommitted files besides the checkpoint:** the sub-agent left work behind. Don't
  sweep in what you haven't seen. Stash it with
  `git stash push -u -m "offshore: leftovers from <unit>" -- <paths>`, log `dirty_tree`
  with the paths, and list the stash in the briefing.
- **`--force-with-lease` rejected:** someone else pushed. `git fetch origin`, look at
  what arrived (`git log HEAD..origin/feature/$PLAN_NAME`), rebase onto it
  (`git rebase origin/feature/$PLAN_NAME`), and push with `--force-with-lease` again.
  Never fall back to bare `--force`.
- **A hook fails on the squashed commit:** fix the cause (often the message) and commit
  again. Never skip the hook.
- **Trailers:** `Closes`/`Refs` lines in the format from "Closing a story" in
  `.claude/reference/tracker.md`. Use `Closes` only for a story this unit finishes (the
  plan README's Stories table says which phase finishes each story); otherwise `Refs`.
  Review-round commits carry no trailers; the PR description says what the PR closes.

## Step 0: Environment

Run this first, on every start and every resume.

```bash
mkdir -p .offshore
# Keep run state out of every commit, even after a careless `git add -A`.
EXCLUDE=$(git rev-parse --git-path info/exclude)
grep -qxF '.offshore/' "$EXCLUDE" 2>/dev/null || echo '.offshore/' >> "$EXCLUDE"

# Integration tests need Postgres in Docker (see .claude/reference/project.md).
# Start the daemon if it's installed but not running.
if ! docker info >/dev/null 2>&1 && command -v dockerd >/dev/null 2>&1; then
  if [ "$(id -u)" -eq 0 ]; then dockerd >/tmp/dockerd.log 2>&1 &
  else sudo -n dockerd >/tmp/dockerd.log 2>&1 &
  fi
  for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
if docker info >/dev/null 2>&1 && docker compose up -d --wait db; then
  echo ready > .offshore/docker.status
else
  echo unavailable > .offshore/docker.status
fi

command -v jq >/dev/null 2>&1 && echo "jq: yes" || echo "jq: MISSING"
```

Record the results in the checkpoint's `environment`:

- **Docker unavailable:** don't shrug it off. Log `docker_unavailable` (with
  `/tmp/dockerd.log`) and make it an Action Item: the person may need to fix the host.
  Integration tests are then the only suite the run may skip.
- **No `jq`:** the guardrail hook can't parse anything and allows every call. Log
  `no_jq` and make it an Action Item. Follow the rules anyway.
- **GitHub access:** note whether this session has the GitHub MCP tools or an
  authenticated `gh` (`gh auth status`). If neither, log `no_github`; Step 8 then ends
  the run as stopped, with the commands the person runs to open the PR.

## Step 1: Resolve the plan and start the run

Derive `PLAN_NAME` from `$ARGUMENTS`:

| Input | Plan name |
| --- | --- |
| A folder name in `.implementation_plans/` | That folder. |
| A story or epic ID (formats in `.claude/reference/tracker.md`) | The plan whose front matter or phase `implements` lists it. If none does, fetch it (tracker operation 4 for a story; operation 1 finds an epic) and derive the name from its title. |
| A description of the work | A short kebab-case name, 2-5 words, without "plan" (see `.implementation_plans/README.md`). |
| Nothing | The one plan whose `CHECKPOINT.json` has `status: in-progress`. If there isn't exactly one, print `Usage: /offshore <plan name, story or epic ID, or description>` and stop. |

If `.offshore/active` exists and names a different plan, print that a run for that plan
is in progress (or died without cleaning up, in which case a person deletes
`.offshore/active`) and stop. If it names this plan, an earlier run died: resume.

Load or create the checkpoint:

```bash
PLAN_DIR=".implementation_plans/$PLAN_NAME"
CHECKPOINT="$PLAN_DIR/CHECKPOINT.json"
mkdir -p "$PLAN_DIR"
[ -f "$CHECKPOINT" ] || printf '%s\n' '{"plan_name":"","feature_branch":"","status":"new","stage":"plan","phases":[],"events":[]}' > "$CHECKPOINT"
cat "$CHECKPOINT"
```

| `status` | Do this |
| --- | --- |
| `complete` | Print `OFFSHORE COMPLETE: see <PLAN_DIR>/BRIEFING.md`, make sure `.offshore/active` is gone, and exit. |
| `stopped` | The person re-ran it after dealing with the reason. Set `in-progress`, log `resumed`, and continue at `stage`. If `stage` is `phases`, set `blocked`, `review-stuck`, and `skipped` phases back to `pending` and clear their `base_sha` (keep `parked_branch`, so the next attempt can reuse the earlier one). |
| `in-progress` | Log `resumed` and continue at `stage`. |
| `new` | Fill `plan_name` and `feature_branch` (`feature/<plan>`), set `in-progress`, log `run_start`. |

Then turn the guardrail on:

```bash
printf 'plan=%s\nstarted=%s\n' "$PLAN_NAME" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > .offshore/active
```

From here on, every way the run ends (complete, stopped, or partial) removes
`.offshore/active`.

## Step 2: Feature branch

The final PR head is always `feature/<plan>`. A harness (a cloud session, for example)
may start you on its own session branch, such as `claude/<slug>-<id>`. That branch is
fine for in-flight work, but it is never the final PR head, and the local branch itself
must be named `feature/<plan>`, because every push below names it. Downstream tooling
keys off the `feature/` prefix.

```bash
git fetch origin develop
git fetch origin "feature/$PLAN_NAME" 2>/dev/null || true       # exists when resuming
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" = "feature/$PLAN_NAME" ]; then
  :                                                              # already on it
elif git show-ref --verify --quiet "refs/heads/feature/$PLAN_NAME"; then
  git switch "feature/$PLAN_NAME"                                # from an earlier run
elif git show-ref --verify --quiet "refs/remotes/origin/feature/$PLAN_NAME"; then
  git switch -c "feature/$PLAN_NAME" --track "origin/feature/$PLAN_NAME"   # resume in a fresh checkout
else
  case "$CURRENT" in
    claude/*) git branch -m "feature/$PLAN_NAME" ;;              # rename the harness session branch
    *) git switch -c "feature/$PLAN_NAME" origin/develop ;;
  esac
fi
```

Bring the branch up to date with `develop`, but only while `stage` is `plan` or
`phases` and no phase is `in-progress` (a running phase's `base_sha` must stay valid;
later stages leave develop drift to the PR cycle):

```bash
if ! git rebase --autostash origin/develop; then
  git rebase --abort
  git merge --no-edit origin/develop     # conflicts: resolve them in this one merge commit
fi
git push -u --force-with-lease origin "feature/$PLAN_NAME"
```

Rebase, don't merge: a merge commit sits outside every squash and stays on the branch
for good. Merge only when the rebase conflicts, and log `develop_merged`.

If the remote refuses the push of `feature/<plan>` (some harnesses only allow their
session branch), log `push_refused`, keep working, and try again at each squash. Don't
make the session branch the PR head. If pushes are still refused at Step 8, the run ends
as stopped, and the briefing gives the person the commands to push the branch and open
the PR.

## Step 3: Plan, if needed

If `.implementation_plans/<plan>/README.md` exists, the plan is already written. If the
checkpoint's `phases` is empty, fill it from the README's phase tracker and each phase
doc's front matter (`phase_id`, `depends_on`), all `pending`; this is a small read you
do yourself. Set `stage: phases` and go to Step 4.

Otherwise capture `BASE=$(git rev-parse HEAD)` and spawn:

```
Agent(
  description: "Plan <plan>",
  subagent_type: "general-purpose",
  prompt: """
    Plan the work below for an unattended run.
    Work: <$ARGUMENTS>
    Plan name: <plan>. The plan folder must be .implementation_plans/<plan>/.
    Branch: feature/<plan> (checked out).

    1. Unless the work is already an epic with stories in the tracker, invoke
       Skill(skill: "plan-product", args: "<$ARGUMENTS>").
    2. Invoke Skill(skill: "plan-tech", args: "<the epic reference from step 1, or the
       work itself>"). The plan name must be <plan>.
    3. Commit everything the plan produced.

    <rules block>

    Return ONLY:
      {"result": "planned" | "blocked",
       "phases": [{"id": "<phase doc file name without .md>", "number": "<phase_id>",
                   "title": "...", "depends_on": ["<phase_id>", ...]}],
       "reason": "<if blocked>",
       "decisions": [...]}
  """
)
```

- `planned`: squash with subject `docs(<plan>): initial plan` and store `plan_sha`. Fill
  `phases` (all `pending`), log `planned`, set `stage: phases`.
- `blocked`: go to Step 9 (the run stops at `stage: plan`).

## Step 4: Phases

For each phase in order whose status is `pending` or `in-progress`:

1. **Dependencies.** If a phase in its `depends_on` isn't `done`, mark this one
   `skipped` ("depends on phase <number>, which is <status>"), log `phase_skipped`, and
   go on to the next.
2. **Base SHA.** If the phase has no `base_sha`, set it to `git rev-parse HEAD`. Mark it
   `in-progress` and log `phase_start`.
   On a resume of an `in-progress` phase, first look for its squash commit:
   `git log --format='%H %s' <base_sha>..HEAD` and a subject containing `(<phase-id>):`.
   If it's there, the phase finished: record that SHA, mark it `done`, and go on.
   Otherwise keep the stored `base_sha` and tell the sub-agent that the commits after it
   are earlier work on this phase.
3. **Spawn the phase sub-agent.** Pass the base SHA explicitly; the sub-agent must never
   guess its diff base.

```
Agent(
  description: "Phase <phase-id>: <title>",
  subagent_type: "general-purpose",
  prompt: """
    Run one phase of plan <plan>, start to finish, in your own context.
    Phase doc: .implementation_plans/<plan>/<phase-id>.md
    Branch: feature/<plan> (checked out and current with develop).
    Base SHA: <base_sha>. Measure this phase's diff from it, never from develop, main,
    or HEAD~N.
    <On a resume: "Commits after the base SHA are earlier work on this phase. Read
    git log <base_sha>..HEAD and continue from there.">
    <If the phase has a parked_branch: "An earlier attempt is on branch
    <parked_branch>. Look at it (git log and git diff against its base) and reuse
    what holds up.">

    1. Prep. Invoke Skill(skill: "prep", args: "<plan> phase <number>").
       - READY TO IMPLEMENT: continue.
       - NEEDS REVISION: make the listed changes to the phase doc, commit them, and
         continue.
       - It recommends splitting the phase: <include the one line that applies>
         <no split_from> write the new phase docs in the format from
           .implementation_plans/README.md, update the README's phase tracker, retire
           the old phase doc, commit, and return "needs-split".
         <has split_from> return "blocked" with stage "prep" (a phase splits once).
       - BLOCKED: return "blocked" with stage "prep".
    2. Build. Invoke Skill(skill: "build", args: "<plan> phase <number>"). If the
       phase's checks can't be made to pass, or build stops on a question that isn't
       yours to answer, return "blocked" with stage "build" and the reason.
    3. Review. Count changed lines (insertions plus deletions) with
       git diff --shortstat <base_sha>..HEAD
         up to 300 → 1 round; 301 to 600 → 2 rounds; over 600 → 3 rounds.
       Each round, invoke Skill(skill: "review", args: "phase <number> of <plan>
       against <base_sha>"):
         - APPROVED: stop reviewing.
         - CHANGES REQUESTED: fix every BLOCK, and every WARN that is a real bug,
           security gap, or missing test. Commit, re-run the checks, next round.
         - NEEDS DISCUSSION: decide it (add it to "decisions"), then treat it as
           CHANGES REQUESTED.
       Style-only findings get at most two rounds of changes; after that, keep the
       code and note the finding.
       If a BLOCK remains after the last round, return "review-stuck".
    4. Before returning "done": the checks for every workspace this phase touched pass
       (commands in .claude/reference/project.md), and everything is committed.

    Also report, from the plan README's Stories table, the story IDs this phase
    finishes ("closes") and the ones it only contributes to ("refs").

    <rules block>

    Return ONLY one of:
      {"result": "done", "files_changed": N, "lines_changed": N, "review_rounds": N,
       "closes": [...], "refs": [...], "notes": "...", "decisions": [...]}
      {"result": "blocked", "stage": "prep" | "build", "reason": "...", "decisions": [...]}
      {"result": "review-stuck", "review_rounds": N,
       "remaining": ["<one line per open finding>"], "decisions": [...]}
      {"result": "needs-split", "reason": "...",
       "phases": [{"id": "...", "number": "...", "title": "...", "depends_on": [...]}],
       "decisions": [...]}
  """
)
```

4. **Handle the result.**

| Result | Do this |
| --- | --- |
| `done` | Mark it `done`; store `closes`, `refs`, `review_rounds`; log `phase_done`. Squash with subject `<type>(<phase-id>): <title>` (`feat` for new behavior; `fix`, `refactor`, `perf`, `docs`, or `chore` when one fits better) and the phase's trailers. Store `squashed_sha`. |
| `blocked`, `review-stuck` | Mark it with the result, the reason or remaining findings, and `parked_branch`; log `phase_parked`. Then park it (below) and go on to the next phase. |
| `needs-split` | Replace the phase in `phases` with the new ones (`pending`, each with `split_from: <old id>`). The first new phase keeps the old `base_sha`, so the split commit folds into its squash. A later phase that depended on the old one now depends on all the new ones. Log `phase_split` and start the first new phase. |

**Parking.** Only phases that finish `done` stay on `feature/<plan>`. A parked phase's
commits move to a side branch, kept for the post-mortem, and the feature branch goes back
to the phase's base. Update the checkpoint first (the block carries it across), and deal
with leftovers as in the squash recipe.

```bash
BASE=<the phase's base_sha>
PARKED="offshore/$PLAN_NAME/$PHASE_ID"
git branch -f "$PARKED" HEAD
git push -u origin "$PARKED"              # if this is refused, log it; the branch stays local
cp "$CHECKPOINT" .offshore/checkpoint.json
git checkout HEAD -- "$CHECKPOINT" 2>/dev/null || true
git switch -C "feature/$PLAN_NAME" "$BASE"
cp .offshore/checkpoint.json "$CHECKPOINT"
git push --force-with-lease origin "feature/$PLAN_NAME"
```

Later phases that depend on a parked phase are skipped in their turn (item 1).

When no phase is left `pending`: if none is `done`, go to Step 9 (the run stops at
`stage: phases`, with nothing to ship). Otherwise set `stage: gate`.

## Step 5: Integration gate

Store `gate.base_sha` (`git rev-parse HEAD`) and spawn:

```
Agent(
  description: "Integration gate",
  subagent_type: "general-purpose",
  prompt: """
    Run the full check suite on feature/<plan>: install dependencies (npm ci), then run
    the "Full check suite" block in .claude/reference/project.md. This catches
    breakage between phases that the per-phase checks miss.

    Integration tests need Postgres in Docker. .offshore/docker.status says "ready" or
    "unavailable". If Docker isn't answering (docker info), try once to start the
    daemon and the database (docker compose up -d --wait db; set TEST_DATABASE_URL as
    project.md says). Skip the integration tests only if that fails, and list the skip
    in "steps_skipped" with the reason. Nothing else may be skipped.

    For each failure: find the root cause, fix it, commit, and re-run that step.
    Repeat until everything passes. If a fix would need an architectural change,
    return "stuck".

    On the final clean pass, record each workspace's passing-test count from its
    runner's summary line (pytest's "N passed", vitest's "Tests N passed"), keyed by
    the workspace names in project.md. Use null for a suite that was skipped. Report
    what ran, never an estimate.

    <rules block>

    Return ONLY:
      {"result": "clean" | "fixes-applied" | "stuck",
       "steps_failed_initially": N, "steps_fixed": N,
       "steps_skipped": [{"step": "...", "reason": "..."}],
       "commits_made": N,
       "test_counts": {"<workspace>": N or null},
       "stuck_reason": "<if stuck>",
       "decisions": [...]}
  """
)
```

Store `result`, `test_counts`, and `steps_skipped`; log `gate_result`. The QA doc and
the briefing reuse them.

- `clean`: nothing to squash. Set `stage: docs`.
- `fixes-applied`: squash with subject `fix(integration): fixes from the integration
  gate`. Set `stage: docs`.
- `stuck`: don't squash (the commits are the post-mortem) and don't open a PR. Go to
  Step 9 (the run stops at `stage: gate`).

## Step 6: Docs

Store `docs.base_sha` and spawn:

```
Agent(
  description: "Write docs",
  subagent_type: "general-purpose",
  prompt: """
    Invoke Skill(skill: "write-docs", args: "<plan>") to document these finished
    phases of plan <plan>: <ids of the done phases>. Branch: feature/<plan>.
    Changelog entries go under "## [Unreleased]" in CHANGELOG.md. Add lines near the
    top; never rewrite or reorder older entries, never add a version heading, never
    bump a version (docs/VERSIONING.md). Commit, but don't push.

    For every file write-docs changed, count its lines before
    (git show <docs.base_sha>:<path> | wc -l; 0 for a new file) and after (wc -l).

    <rules block>

    Return ONLY:
      {"files_written": [{"path": "...", "before_lines": N, "after_lines": N}],
       "changelog_updated": true | false, "review_status": "<REVIEW_STATUS from
       write-docs>", "notes": "<its NOTES>", "decisions": [...]}
  """
)
```

Before squashing, check the result yourself (without reading the docs):

- **Shrunk docs.** A file with `before_lines > 100` and `after_lines` under half of that
  is a regression. Restore it with
  `git restore --source "$BASE" --staged --worktree -- <path>`, where `BASE` is
  `docs.base_sha` (the restore lands in the squash), and log `doc_regression`.
- **Versions.** If `git diff "$BASE" -- package.json` changes `"version"`, restore
  `package.json` the same way. If `CHANGELOG.md` gained a `## [x.y.z]` heading, move its
  entries back under `## [Unreleased]`. Log `doc_regression` either way.

Squash with subject `docs(<plan>): changelog and docs`. Set `stage: qa`.

## Step 7: Manual QA doc

The run writes the acceptance doc; it doesn't run it. A headless container has no
reliable browser session, and manual acceptance is the person's gate.

Store `qa.base_sha` and spawn:

```
Agent(
  description: "Write the manual QA doc",
  subagent_type: "general-purpose",
  prompt: """
    Write .implementation_plans/<plan>/MANUAL_QA.md from the template
    .claude/skills/offshore/MANUAL_QA.template.md. Branch: feature/<plan>. It is the
    by-story acceptance doc the person works through before merging: organize it by
    story, not by phase. Don't run the steps.

    Read only:
    - The plan README's Stories table (which phases deliver each story), and each
      story's acceptance criteria (tracker operation 4 in .claude/reference/tracker.md).
    - The feature diff: git diff --stat origin/develop...HEAD, then the parts that add
      or change routes, pages, API endpoints, permissions, and error codes. Every step
      must match behavior the diff actually ships. Never invent behavior.
    - Integration gate results: test counts <gate.test_counts>, skipped suites
      <gate.steps_skipped>.

    Fill in the template:
    1. "Automated coverage": the real test counts. Name a skipped suite instead of
       giving it a number.
    2. "Prerequisites": the personas (.claude/reference/project.md), permissions,
       seed data, and viewports the steps need.
    3. One section per story with a user-visible surface, headed with its ID, title,
       and contributing phases. Numbered steps, each one concrete action and its
       expected result, numbered continuously across the doc. A story with no
       user-visible surface gets one line saying automated tests cover it.
    4. "Automated re-run": the check commands from .claude/reference/project.md.

    If .claude/reference/tracker.md says a story is closed by editing a file, make that
    edit for each story this PR finishes.

    Commit.

    <rules block>

    Return ONLY:
      {"stories_covered": [...], "stories_without_surface": [...], "total_steps": N,
       "closes": [<stories this PR finishes>], "refs": [<stories it only advances>],
       "decisions": [...]}
  """
)
```

Store `closes` and `refs` for the PR description, log `qa_written`, and squash with
subject `docs(<plan>): manual QA acceptance doc`.

**Commit-shape check before the PR.** Run `git log --oneline origin/develop..HEAD`. The
branch should hold: the initial plan (if this run planned), one commit per done phase,
at most one integration commit, the docs commit, and the QA commit (plus one develop
merge commit, if Step 2 needed it). If there are extra commits (a lone checkpoint
commit, an unsquashed fix), fold each into the commit before it with a scripted rebase:
set `GIT_SEQUENCE_EDITOR` to a `sed -i.bak` command that changes their `pick` lines to
`fixup`, run `git rebase -i --autostash origin/develop`, and push with
`--force-with-lease`. If that rebase conflicts, `git rebase --abort`, leave the history
as it is, and note the extra commits in the briefing.

Set `stage: pr`.

## Step 8: Final PR

If `environment.github` is `none`, or pushes of `feature/<plan>` are still refused, don't
open a PR: log `pr_stuck` with the reason and go to Step 9 (the run stops at
`stage: pr`).

Spawn:

```
Agent(
  description: "Final PR: open it and drive it to green",
  subagent_type: "general-purpose",
  prompt: """
    Open the final PR for plan <plan> and drive it to green. Never merge it.
      base: develop
      head: feature/<plan>
      title: <plan title>
    Use the GitHub MCP tools or the gh CLI, whichever this session has.
    <If pr.number is set: "PR #<N> is already open. Don't open another.">

    Body: follow .github/PULL_REQUEST_TEMPLATE.md and fill every section.
    - Summary: the plan README's overview in 1-3 sentences.
    - Closes: one line per story in the format from "Closing a story" in
      .claude/reference/tracker.md: Closes for <qa.closes>, Refs for <qa.refs>.
    - Three questions, and Migrations and breaking changes: from the plan and the diff.
    - Test plan: CI green; automated review addressed; manual QA in
      .implementation_plans/<plan>/MANUAL_QA.md.
    Then add two sections:
      ## Phases
      | Phase | Status | Notes |      (one row per phase: <phase rows>)
      ## Briefing
      .implementation_plans/<plan>/BRIEFING.md (added when the run ends)

    Right after opening it, write the PR number to .offshore/final-pr.txt.

    Opening the PR and each push start CI and, if .github/workflows/claude-review.yml
    exists, the automated review. Don't post comments to trigger them.

    Loop. Poll every one to two minutes. Stop waiting on any single CI or review run
    after 60 minutes and return "stuck". Each time, read the PR (its mergeable state),
    its check runs, and its comments and review threads.

    The automated review is done for the head commit only when its "review" check has
    concluded AND a claude[bot] comment newer than the head commit says it finished.
    A green check alone is not proof:
      - Green, but no new comment: the review skipped itself (it does this, while
        reporting success, on a PR that edits its own workflow file). Record
        review_status "skipped" and go on; the per-phase reviews are the floor.
      - "cancelled": a newer push superseded it. Wait for the newer run.
    If claude-review.yml doesn't exist, review_status is "none", and green CI is enough.

    On each pass:
    - CI failed and the log is readable: fix the root cause.
    - CI failed and the log isn't readable: push at most 2 diagnostic commits (verbose
      flags, extra output). After that, return "stuck".
    - Review findings: dedupe first (one finding can arrive under two logins; key on
      path, line, and body). Invoke Skill(skill: "address-pr-comments", args: "<PR
      number>. Unattended offshore round <N>: commit your fixes but don't push; the
      round is squashed before the push."). Fix every real finding (a bug, a security
      gap, a failing test). Every other finding gets a fix or a reply with the reason:
      nothing is dismissed silently.
    - A style finding on lines you already changed and defended in two rounds: reply
      pointing to the earlier decision, resolve the thread, and don't change the code.
    - Mergeable state "dirty" (conflicts): git fetch origin develop, then
      git rebase origin/develop, resolve, re-run the checks, and push with
      --force-with-lease.
    - Checks green, review done (or "skipped" or "none"), no unaddressed findings, no
      conflicts: stop and return "ready-for-review".

    Round squash. A round is the fix commits for one review pass. When the round's
    findings are all fixed or answered and the checks pass locally, squash the round
    into one commit BEFORE you push; the push starts the next review, which should see
    one commit per round:
      BASE=<HEAD when this round started>
      BODY=$(git log --reverse --format='- %s' "$BASE"..HEAD)
      git reset --soft "$BASE"
      git commit -F - <<EOF
      fix(review-round-<N>): <one-line summary>

      $BODY
      EOF
      git push --force-with-lease origin "feature/<plan>"
    Use feat, fix, perf, or refactor, whichever dominates. No Closes/Refs lines. A
    round that changed no code (replies only) has nothing to squash and pushes nothing:
    never push an empty commit to re-trigger a review. If address-pr-comments pushed
    anyway, squash and push with --force-with-lease; the newer review run supersedes
    the older one. At most 5 rounds; after that, return "stuck" with what remains.

    Never merge the PR and never turn on auto-merge. The person merges.

    <rules block>

    Return ONLY:
      {"result": "ready-for-review" | "stuck",
       "pr_number": N, "pr_url": "...", "head_sha": "...",
       "ci_status": "green" | "red" | "pending",
       "review_status": "clean" | "skipped" | "none" | "issues-remaining",
       "rounds": [{"round": N, "sha": "<squashed SHA or null>", "fixed": N, "answered": N}],
       "unresolved": ["<one line each>"],
       "decisions": [...]}
  """
)
```

Store `pr.number` (from `.offshore/final-pr.txt` if the sub-agent died), `pr.result`,
and `pr.rounds`. Log `pr_opened`, a `pr_round` per round, and `review_skipped` if the
review skipped itself.

- `ready-for-review`: set `stage: briefing`.
- `stuck`: log `pr_stuck` with `unresolved`. The PR stays open. Leave `stage: pr`, so a
  re-run picks up the PR cycle again, and go to Step 9.

## Step 9: Briefing, then stop

Every run ends here, complete or stopped. A stopped run keeps the `stage` it stopped at,
so re-typing `/offshore <plan>` resumes there.

1. **Commits.** Run `git log --oneline origin/develop..HEAD`. Update the checkpoint's
   SHAs from the subjects (a rebase in Step 8 may have rewritten them). Compare the count
   with the target in "Commit shape" below and note it for Run Health.
2. **Write the briefing.** Copy `.claude/skills/offshore/BRIEFING.template.md` to
   `.implementation_plans/<plan>/BRIEFING.md` and fill every section from the checkpoint,
   `.offshore/guardrails.log`, and the commit list; don't read source files for it. The
   Action Items include every phase that isn't `done` (with its parked branch), stuck
   gate or PR items, doc regressions, leftover stashes, Docker, `jq`, or GitHub problems,
   a skipped automated review, and "Review PR #N, work through `MANUAL_QA.md`, merge when
   ready".
3. **Final status.** `complete` if the PR is `ready-for-review` (then set
   `stage: done`); otherwise `stopped`. Log `complete`, or `stopped` with the reason.
4. **Commit and push** the briefing and the checkpoint together, in one commit:

   ```bash
   git add "$PLAN_DIR/BRIEFING.md" "$PLAN_DIR/CHECKPOINT.json"
   git commit -m "docs($PLAN_NAME): offshore briefing"
   git push origin "feature/$PLAN_NAME"
   ```

   If there is no remote branch (pushes refused), the commit stays local and the
   briefing says so.
5. **Confirm green.** When there's a PR, wait for the checks on the new head commit (up
   to 30 minutes; the commit only adds docs). If a check fails, go back to Step 8 with
   the PR number, then update the briefing in one more commit. The automated review
   runs again too; if it reports a real problem (not wording in the briefing), treat it
   the same way. Don't print `COMPLETE` until the checks on the final head are green.
6. **Turn the guardrail off:** `rm -f .offshore/active`. Leave the logs in `.offshore/`
   for the person; git ignores them.
7. **Print:**

   ```
   OFFSHORE COMPLETE | OFFSHORE STOPPED
   Plan:     <plan>
   PR:       #<N>, green, open for your review (not merged) | none: <reason>
   Phases:   <done> done, <blocked> blocked, <stuck> review-stuck, <skipped> skipped, of <total>
   Time:     <Xh Ym>
   Briefing: .implementation_plans/<plan>/BRIEFING.md
   Action items: <count>
   ```

Then exit.

## Stopping at a boundary

If your context is getting heavy, stop between units: never mid-phase or mid-PR-cycle.
(A person's explicit "stop" is the exception; it stops you at once.)

1. Make sure the checkpoint on disk is current. It doesn't need a commit.
2. Log `partial_exit`, and remove `.offshore/active`.
3. Print:

   ```
   OFFSHORE PARTIAL
   Plan:   <plan>
   Done:   <N>/<total> phases
   Next:   <phase-id | integration gate | docs | manual QA | final PR | briefing>
   Resume: type /offshore <plan>
   ```

A phase, the gate, the docs, the QA doc, and the PR cycle are each atomic from your side:
you only see their results at a boundary. A resume reads the checkpoint and continues.
In a fresh checkout the committed checkpoint may lag one unit behind; trust the commit
subjects over it (a unit whose squash commit exists is done).

For a plan too large for one session, the person can type `/loop 5m /offshore <plan>`
once. Each fire resumes from the checkpoint; fires after completion print the COMPLETE
line and do nothing. Never start `/loop` yourself.

## Commit shape

After a good run, `git log --oneline origin/develop..feature/<plan>` reads like this:

```
docs(notes-sharing): offshore briefing
fix(review-round-2): keep the shared-with-me list sorted after a revoke
fix(review-round-1): scope share lookups to the note's owner
docs(notes-sharing): manual QA acceptance doc
docs(notes-sharing): changelog and docs
fix(integration): fixes from the integration gate
feat(phase-3-share-ui): share dialog and shared-with-me page
feat(phase-2-share-permissions): permission checks for shared notes
feat(phase-1-share-api): sharing endpoints and model
docs(notes-sharing): initial plan
```

That is one plan commit, one per done phase, one docs, one QA, one briefing, and one per
review round: `phases + 4 + rounds`, plus at most one integration commit and one develop
merge. Each phase and each round is one commit, so `git revert <sha>` rolls exactly one
back; the briefing's Rollback section depends on that. A branch at twice the target means
a squash was skipped.

## What this skill doesn't do

- No PR per phase. Phases are commits on the feature branch; one PR at the end gets the
  automated review's final pass.
- No merging. The deliverable is a green PR plus the briefing.
- No running the manual QA steps.
- No questions. Decisions are made, logged, and surfaced.
- No micro-commits on finished units. Parked phases keep theirs, on their side branch.
- No watchdog. The checkpoint is the recovery mechanism.
