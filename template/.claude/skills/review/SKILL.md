---
name: review
description: Review a branch (or the current plan phase) with the specialist reviewers, check it against Accepted decisions, optionally run sequential independent review cycles, and give a merge verdict. Run it before opening or merging a PR.
argument-hint: "[phase [N] [of <plan>]] [against <branch>] [just <area>] [<N> cycles] [--full]"
disable-model-invocation: true
model: sonnet
---

# Review

You are the review orchestrator. You run a structured code review with the specialist
reviewer roles, produce one unified report, and give a merge verdict.

The request (may be empty):

$ARGUMENTS

## Step 1: Parse the request

**Mode:**

- **Phase review:** the request mentions "phase", "current phase", "plan",
  "deliverables", or "implementation".
- **Multi-cycle review:** the request asks for cycles or passes ("3 cycles", "two
  passes", "triple review", "deep review", "thorough review", "sequential independent
  reviews"). Separate reviewers read the diff cold, one after another, with fixes
  applied between them. The default is 3 cycles; honor any count the person gives.
  Multi-cycle combines with phase mode ("three cycles on the current phase"): the
  deliverables check runs in cycle 1 only.
- **On-demand review:** everything else, including empty input.

**Base branch override:** "against main", "vs staging", "compared to develop". If none,
detect it in Step 2.

**Scope restriction:** "just backend", "frontend only", "docs only", "backend and
frontend". If none, the changed files decide in Step 5.

**Plan and phase hint** (phase mode): "phase 3 of notes-sharing", "current phase".
"Current phase" with no plan name means detect the plan too.

**`--full`:** run the lead's cross-cutting review even with one specialist.

## Step 2: Detect the base branch

Use the branch the person named. Otherwise try, in order:

1. An open PR for the current branch: `gh pr view --json baseRefName -q '.baseRefName'`.
   Skip this if `gh` isn't available.
2. The upstream branch: `git rev-parse --abbrev-ref @{upstream}`. Use it only if it's a
   different branch (`origin/develop` means `develop`), not the remote copy of the
   current branch.
3. `develop`, the base branch in `.claude/reference/project.md`.

If the current branch is `main`, `staging`, or `develop` and has no open PR, stop:

> You're on `<branch>` with no open PR. I need a feature branch to diff, or name a base:
> `/review against develop`.

## Step 3: Get the diff

```bash
git diff --name-only <base>...HEAD
```

- **No files changed:** stop. "No changes found between HEAD and `<base>`. Nothing to
  review."
- **More than 200 files:** warn: "This diff touches N files. Consider scoping the
  review, for example `/review just backend`." Then proceed unless the person narrows it.

Keep the file list; Step 5 uses it.

## Step 4: Phase context (phase mode only)

**4a. Find the plan.**

1. From the hint: match it against the active plan folders
   (`ls -d .implementation_plans/*/ | grep -v DONE`).
2. From the branch: `feature/<plan-name>` names the plan.
3. Ambiguous or no match: ask ONE question that lists the active plans.

**4b. Find the phase.** Use the number the person gave. Otherwise read the plan's
`README.md` Phase tracker: the current phase is the first row not marked `Done`.
Cross-check with any phase number in the branch name.

**4c. Read the phase doc** (`phase-<N>-<slug>.md`, or whichever file in the plan folder
carries that phase number). Extract:

- **Deliverables:** the numbered list under Deliverables
- **Acceptance criteria**
- **Hand-off to the next phase:** if it's filled in, the phase may already be complete

## Step 5: Map changed files to specialists

Use the "Review specialists" table in `.claude/reference/project.md`: each changed path
maps to a role file in `.claude/roles/review/`. Skip files under
`.implementation_plans/` and `.claude/`.

- **Cross-cutting rule:** if two or more distinct specialists apply (or `--full` was
  given), the lead also reviews the cross-cutting concerns (Step 7).
- **Scope restriction:** if the person limited scope, run only those specialists. Note
  what was left out: "Note: changes in `<workspace>` were not reviewed per scope
  restriction."

## Step 6: Specialist reviews

For each specialist:

1. **Read its role file** and adopt that reviewer: perspective, personality, checklist,
   output format. Read it fresh each time you switch.
2. **Read the changed files in its domain.** On a large diff, start with the most
   impactful changes: new files, schemas, migrations, routers, hooks, components.
3. **Review against its checklist.** Report only violations and concerns. Don't list
   what passed.
4. **Phase mode:** rate each deliverable:
   - **DONE:** the diff clearly delivers it
   - **PARTIAL:** some work exists but it's incomplete
   - **MISSING:** nothing in the diff addresses it
5. **Write its findings** in its output format (BLOCK / WARN / NOTE and what's good),
   with file:line where possible.

## Step 7: Lead cross-cutting review

Run this only when two or more specialists applied, or with `--full`.

Read `.claude/agents/review-lead.md` and apply its cross-cutting checklist inline:

- Auth and data scoping across layers
- API contract drift between backend schemas and frontend usage
- Error codes translated
- Shared-package discipline
- Migrations vs models

**Phase mode:** check that deliverables spanning backend and frontend are wired end to
end, not just present on each side.

## Step 8: Decision check

Read the Accepted records listed in `docs/decisions/README.md`. If the change touches
anything an Accepted record's invariants or References cover (when unsure, assume it
does), spawn the `decision-checker` subagent (Agent tool,
`subagent_type: "decision-checker"`).

**Provide:**

- Mode: `diff`
- Repo path, branch, and base branch
- The changed-file list
- The diff (`git diff <base>...HEAD`). If it's over about 3000 lines, pass only the file
  list and say the diff was too large to include.
- The phase doc path (phase mode)

Don't paste the decision records; it reads them itself.

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/decision-checker.md` and apply it inline, and say in your report
that it ran inline. If a spawn fails with a transient error, retry up to three times
before falling back.

A FLAG marked blocker counts as a BLOCK in the verdict; a watch counts as a WARN.

## Step 9: Sequential independent review cycles (only if requested)

Skip this step unless the person asked for multiple cycles. Steps 5-8 are enough for
most changes.

Steps 5-8 are **Cycle 1**. Then spawn `N - 1` more reviewers, **one at a time**. Between
cycles you fix the obvious findings, so each later cycle reviews the post-fix state and
spends its attention on what's still wrong.

**Why sequential, not parallel:** parallel reviewers all rediscover the same surface
issues, and reconciling them turns into deduplication. Sequential cycles each start
from a cleaner baseline, so what cycle N finds survived cycle N-1's fixes.

### Per-cycle loop

For each cycle from 2 to N:

1. **Spawn the cycle reviewer** (below), fresh, with nothing from earlier cycles.
2. **Wait for its findings.**
3. **Fix between cycles**, in this order:
   - **BLOCKs:** fix before the next cycle. If a BLOCK is contested or needs the
     person's input, pause and ask; don't push it to the next cycle.
   - **Obvious WARNs:** small, mechanical fixes (test cleanup, a missing type, a typo, a
     better mock). Apply them: option 1 of the Address-or-Defer rule.
   - **Subtle WARNs and NOTEs:** skip only with a real reason (option 2). Otherwise
     collect the finding for the decision pause at the end (option 3). Don't file a
     follow-on phase doc yourself.
   - **Style findings:** after cycle 2, don't act on a style-only finding that reverses
     an earlier fix. Record it in the rollup instead of flip-flopping.
4. **Commit the fixes** as `chore(<plan>): address independent review #<N> findings`
   (or `chore: ...` outside a plan), listing what was fixed and what was deferred with
   its reason. Never commit a new follow-on phase doc here.
5. **Run the checks** for the touched workspaces (`.claude/reference/project.md`) to
   confirm the fixes hold.
6. Move to the next cycle.

### Address-or-Defer rule

For every WARN or NOTE, you **propose** a disposition. There are three, and you may
take only the first two on your own:

1. **Address it now**, in this change. Cheap, mechanical, clearly in scope.
2. **Record a real reason not to fix it.** A real reason cites a contract, a test, an
   existing design choice, or a tradeoff, with a code or spec reference. "It's small",
   "stylistic preference", and "we'll get to it" are not reasons; those findings belong
   in option 1 or option 3.
3. **Defer to a follow-on phase doc.** This needs the person's explicit go-ahead before
   any file is created. Don't write a follow-on phase doc, add to a plan's tracker, or
   change any other plan document on your own.

Present each option-3 candidate as one decision point:

- **(a) Fold into this PR:** the extra work (line estimate, files touched, scope risk)
- **(b) Create a follow-on phase doc:** which plan it belongs to, what it covers
- **(c) Skip with a real reason:** the proposed reason and the reference behind it

Then wait for the person to pick. "(b), go" means write the doc. "(a)" means fold the
work in. "(c)" means record the reason and move the row to Part A of the rollup.

Filing the follow-on doc yourself feels efficient. Don't: the person may prefer to
expand this PR instead of sequencing the work, and filing it takes that choice away. If
you want to skip a finding without option 1, option 2, or surfacing it as an option-3
candidate, stop and ask. If you can't ask (for example inside `/offshore`), leave every
candidate in Part B and create nothing.

### How to spawn each cycle

Spawn the `review-lead` subagent (Agent tool, `subagent_type: "review-lead"`). It has no
Edit or Write tools.

**Provide:**

- Repo path, branch name, and base branch
- The phase doc path (phase mode)
- Validation status, for example "typecheck PASS, lint PASS, 142 tests passing; don't
  re-run mechanical checks"
- The diff stats (`git diff --stat <base>...HEAD`)
- The specialist role files that match the changed files (Step 5). Its own file is
  already its system prompt.
- The cycle framing (below)
- The output demand: "Return a punch list with BLOCK / WARN / NOTE severity, one line per
  finding, file:line where applicable, at most 20 findings. Mark anything you think
  should be deferred rather than fixed, with the reason."

The prompt must:

1. Say this is a cold, fresh review, and forbid assuming earlier reviewers caught
   everything.
2. Say earlier reviews ran and their fixes are applied: "Prior independent reviews ran
   and their findings were addressed before you started. You're reviewing the current
   state of the branch: what's still wrong, or what they missed."
3. Contain **none** of your reasoning, your findings, earlier cycles' findings, or hints
   about where to look in this diff. The focus areas below are generic categories; keep
   them generic.

**Middle cycles** (cycle 2 of 3, for example): "This is independent review pass <N>. The
earlier passes ran and their fixes are applied. Find what's still wrong or what they
missed." Focus: race conditions, state handling completeness, async cleanup, the
integration paths between layers, call sites a refactor missed.

**Final cycle:** "This is the final independent review pass (cycle N of N). Earlier
passes found structural bugs that are now fixed. Find what they missed, and what's
structurally fragile even if it works today. Look in the corners." Focus: contract drift
between frontend types and backend schemas, malformed-input defenses, empty, null, and
NaN edge cases, test mocks that invent fields the real API doesn't return, call sites
elsewhere in the repo, hand-off notes that promise things that don't exist.

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/review-lead.md` and apply it inline for each cycle, and say in your
report that the cycles ran inline, so they were not independent. If a spawn fails with
a transient error, retry up to three times before falling back.

### Reconciliation

After every cycle has returned and its fixes are committed:

1. List what was fixed between each pair of cycles.
2. Highlight final-cycle catches: a finding that survived N-1 cycles is the real value.
3. Adjust the verdict if any cycle's BLOCKs remain unresolved.
4. Compile the deferrals rollup (Step 10). Every WARN and NOTE not fixed in this change
   appears there.

### When to recommend multi-cycle

Recommend it for large changes (1000+ lines), high-risk changes (auth and data scoping,
security boundaries, secrets, migrations on tables that hold data), and the final pass
before merging a phase. Don't recommend it for trivial changes, work in progress, or a
quick feedback pass. If the person asks for it on a tiny change, run it anyway.

## Step 10: Unified report

```markdown
## Review: <one-line description of what changed>

**Mode:** On-demand | Phase review: <plan> phase <N>: <title> [+ multi-cycle (sequential)]
**Base:** `<base>` (detected via PR target | upstream | fallback | named)
**Files changed:** <count>
**Specialists invoked:** <list>
**Cycles run:** <N> (sequential independent, with fixes between cycles)
```

Omit the "Cycles run" line for a single-cycle review.

**Phase mode:** add the completeness section.

```markdown
---

### Phase Completeness: <plan> phase <N>

| # | Deliverable | Status |
| --- | --- | --- |
| 1 | <deliverable> | DONE / PARTIAL / MISSING |

- Phase marked `Done` in the phase doc and README tracker: yes / no
- Story keywords (`Closes` / `Refs` per `.claude/reference/tracker.md`) present: yes / no

**Assessment:** All deliverables addressed / N deliverables need attention / Phase not ready for hand-off
```

**Then the findings:**

```markdown
---

### Cross-Cutting Findings
<Lead's findings. Or: "Not applicable: single specialist invoked.">

### Decision Check
<CLEAR or FLAG output. Or: "Not needed: no Accepted invariants touched." Add "(ran inline)" if it did.>

---

### Backend Review
<Findings. Or: "No backend files changed." Or: "No issues found.">

### Frontend Review
<Findings, same rules.>

### UI Kit Review
<Findings, same rules.>

### Docs Review
<Findings, same rules.>
```

**Multi-cycle only:** add the reconciliation.

```markdown
---

### Cycle Reconciliation

**Cycle 1 (orchestrator):** N findings (B BLOCK, W WARN, X NOTE)
- Fixed before cycle 2: <list>
- Deferred (see rollup): <list>

**Cycle 2 (independent):** N findings (B BLOCK, W WARN, X NOTE)
- Fixed before cycle 3: <list>
- Deferred (see rollup): <list>

**Cycle 3 (independent):** N findings (B BLOCK, W WARN, X NOTE)
- Fixed: <list>
- Deferred (see rollup): <list>

**Final-cycle catches** (the final cycle found them; earlier cycles missed them):
- <list>

**Cross-confirmed findings** (more than one cycle flagged them):
- <list>

**Cycle 1 blind spots** (a later cycle caught them; the standard pass missed them):
- <list>
```

If both "Final-cycle catches" and "Cycle 1 blind spots" are empty, one cycle would have
been enough. If either has a BLOCK, recommend multi-cycle for similar changes.

**Deferrals rollup:** required whenever the review produced WARN or NOTE findings.

```markdown
---

### Deferrals Rollup

#### Part A: Already disposed

| # | Finding | Cycle | Disposition | Reference |
| --- | --- | --- | --- | --- |
| 1 | <summary, file:line> | Cycle N | Fixed in this PR / Real reason not to fix | <commit SHA or cited reason> |

#### Part B: Awaiting your decision

**Candidate 1: <summary, file:line>** (flagged by cycle N)

- **(a) Fold into this PR:** <line estimate, files touched, scope risk>
- **(b) Create a follow-on phase doc:** under `<plan>`; would cover <one sentence>
- **(c) Skip with a real reason:** proposed: "<reason>"; reference: <code or spec citation>

Recommendation: <a | b | c>, because <one line>. Tell me which and I'll do it.
```

Write "No items in this part." for an empty part. A Part A row without a Reference isn't
disposed: move it to Part B. While Part B has candidates, don't create a follow-on phase
doc, add to a plan tracker, or change any other plan document. After the person picks:
(a) fold the work in, re-run the checks, and review the new code once; (b) write the
doc and add it to the plan's tracker; (c) move the row to Part A.

**Close with:**

```markdown
---

### Verdict: APPROVED / CHANGES REQUESTED / NEEDS DISCUSSION

### What's Good
- <things done well across all specialists, briefly>
```

**Verdict logic:**

- **APPROVED:** no BLOCKs and no blocker FLAG. In phase mode, every deliverable DONE.
- **CHANGES REQUESTED:** any BLOCK or blocker FLAG. In phase mode, any deliverable
  MISSING.
- **NEEDS DISCUSSION:** findings that need a person's judgment, a FLAG whose fix would
  mean changing an Accepted decision, or PARTIAL deliverables with unclear scope.

**Formatting rules:**

- A specialist section with no findings is one line: "No issues found."
- A workspace with no changed files is one line: "No <area> files changed."
- NOTEs are one line each. Don't pad a clean review; say it's clean and stop.

**Scale each explanation to the fix:**

- **Simple fix** (swap a constant, add an import, use an existing helper): one sentence
  with the problem and the fix.
  > **models.py:24**: Magic number for the column length. Use `MAX_SHORT_STRING` from
  > `core/schemas/validators.py`. Ref: `apps/backend/docs/Agents.md`, Validation and security.
- **Moderate fix** (logic, missing validation, wrong pattern): two or three sentences:
  the problem, the risk, the fix.
- **Complex fix** (security boundary gaps, cross-layer mismatches, architectural
  violations): lead with the problem and the fix, then describe the failure scenario.

A developer scanning the review should see what to do first. The explanation supports
the fix; it doesn't bury it.

## Error handling

- **Not a git repository:** "This doesn't appear to be a git repository."
- **On an integration branch with no PR:** see Step 2.
- **No changes:** see Step 3.
- **`gh` not available:** skip PR detection; use the upstream or the fallback.
- **Ambiguous plan name:** ask ONE question listing the active plans.
- **Plan not found:** "Couldn't find an active plan matching '<hint>'. Active plans: <list>."
- **Phase doc not found:** "Plan '<name>' has no phase <N> doc. Available: <list>."
- **Very large diff (200+ files):** warn and suggest scoping, then proceed.

## Notes

- Read each specialist's role file before its review. The role files distill the rules
  from the area guides and `docs/SECURITY.md`; read those sources only when a finding
  needs more context.
- In phase mode, the phase doc says what should have been built and the diff shows what
  was built. Check both standards and completeness.
- Outside the between-cycle fixes in Step 9, don't change code. Flag the issue and
  describe the fix.
- Write each section in its reviewer's voice: the lead is blunt, the backend reviewer is
  clinical, the frontend reviewer is energetic, the UI kit reviewer is meticulous, the
  docs reviewer is warm but firm.
