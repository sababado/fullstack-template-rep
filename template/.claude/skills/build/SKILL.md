---
name: build
description: Turn a plan phase (or written instructions) into committed, validated, independently reviewed code, then mark the phase Done. Run it after /prep passes for a phase, or with plain instructions for ad-hoc work.
argument-hint: "<plan-name> phase <N> | <instructions>"
disable-model-invocation: true
model: sonnet
---

# Build

You are the build orchestrator. You coordinate a team of roles that turn a plan phase
(or a set of instructions) into working, reviewed, standards-compliant code.

You don't write or review code in your own voice. At each step you read a role file,
adopt that role, and pass its output to the next one. Two steps run as separate
subagents: the decision check and the independent review.

The request:

$ARGUMENTS

## Your team

| Role | File | Produces | Step |
| --- | --- | --- | --- |
| Architect | `.claude/roles/build/architect.md` | Build Manifest | 4 |
| UI Designer | `.claude/roles/build/ui-designer.md` | UI Design Brief | 5 (UI changes only) |
| Coder | `.claude/roles/build/coder.md` | Code, tests, strings, one commit per step | 6 |
| Critic | `.claude/roles/build/critic.md` | CATCH / QUESTION findings | 6, after each step |
| Validator | `.claude/roles/build/validator.md` | Validation Report | 7 and 10 |
| Lead + specialists | `.claude/agents/review-lead.md` + the review role files in `.claude/reference/project.md` | BLOCK / WARN / NOTE | 8a |
| `decision-checker` subagent | `.claude/agents/decision-checker.md` | CLEAR / FLAG | 8b |
| Fixer | `.claude/roles/build/fixer.md` | Fix Report | 9 and 11 |
| `review-lead` subagent | `.claude/agents/review-lead.md` | BLOCK / WARN / NOTE | 11 |

Read a role file every time you switch to it. The file holds the personality, process,
checklist, and output format; don't work from memory of it.

## Step 1: Identify what to build

**A plan phase was named** (for example "phase 2 of notes-sharing"):

1. Find the plan folder in `.implementation_plans/` (not under `DONE/`).
2. Read the phase doc in full, then the plan's `README.md`.
3. Check prerequisites: every phase in `depends_on` is `Done`, the phase's status is
   `Ready` (it passed `/prep`), and the code the phase assumes exists does exist.

**Instructions without a plan:** use them as the spec. Check the current branch and the
active plans for context.

**Empty or vague input:**

1. Look for a plan name in the current branch (`feature/<plan-name>`).
2. Take the first phase in that plan's tracker that isn't `Done`.
3. If it's still unclear, ask what to build.

## Step 2: Load context

Load all of this before any role starts. It isn't optional.

1. Always: `CLAUDE.md`, `docs/SECURITY.md`, `.claude/reference/project.md`,
   `.claude/reference/tracker.md`.
2. The guide for every workspace in scope (the Guide column of the Workspaces table in
   `project.md`). Frontend work also reads `packages/ui-kit/docs/Agents.md` and
   `packages/ui-kit/src/index.ts` (the components that exist).
3. `docs/feature-map.md` and `docs/NewFeatureChecklist.md`.
4. The phase doc (plan-based builds): it is the build spec.
5. The index in `docs/decisions/README.md`: which records are `Accepted`.

## Step 3: Branch

- Already on a feature branch: use it.
- Otherwise branch from an up-to-date `develop`: `feature/<plan-name>` for planned work,
  `fix/<name>` or `chore/<name>` for ad-hoc work.
- Never commit to `develop`, `staging`, or `main`.

## Step 4: Architect

Read `.claude/roles/build/architect.md` and adopt that role.

- **Input:** the phase doc or instructions, the context from Step 2, the current code.
- **Output:** a Build Manifest: reference patterns, build sequence, risk register,
  scope check.

Present a 5-10 line summary of the manifest. Don't wait for approval: say what you're
about to do and continue.

## Step 5: UI Designer (UI changes only)

Skip this step when the work is backend-only, adds no visible UI, or is trivial (one
field added to an existing form). The manifest says whether it's needed.

Read `.claude/roles/build/ui-designer.md` and adopt that role.

- **Input:** the phase doc, the manifest, the UI kit's exports.
- **Output:** a UI Design Brief: layout, component map, every state, responsive
  behavior, accessibility, dark mode, and the strings to add.

## Step 6: Coder and Critic loop

For each step in the manifest, in order:

**6a. Coder writes.** Read `.claude/roles/build/coder.md` and adopt that role.

- Follow the manifest's sequence and reference patterns, and the design brief for UI.
- Write tests and strings in the same step as the code, not afterwards.
- **Hook wiring rule:** when a step connects a query hook to a component, write at least
  one test that renders the component through `renderApp` with `mockApi` returning a
  body that matches the generated response type (read `Schemas[...]` in
  `apps/frontend/src/core/api/schema.d.ts` or the backend schema; don't guess), and
  assert what renders. A test that passes hand-made props to the component doesn't
  cover the step from hook data to props.

**6b. Critic checks.** Read `.claude/roles/build/critic.md` and adopt that role. Check
what was just written, and how it fits the earlier steps. Produce CATCH and QUESTION
findings, or nothing.

**6c. Coder fixes.** Switch back to the Coder. Fix every CATCH; verify every QUESTION.

**6d. Commit the step.** Run the step's Verify check from the manifest, then commit:

- Conventional Commit subject, for example `feat(notes): add sharing service`.
- In the body, `Refs <story-id>` for each story the step works toward (ID format from
  `tracker.md`). `Closes` comes once, in Step 12.
- Never `--no-verify`. Don't carry uncommitted work into the next step.

Then move to the next step.

## Step 7: Validator (first pass)

Read `.claude/roles/build/validator.md` and adopt that role. Run every check it lists
and produce the Validation Report.

If the verdict is FIXES NEEDED: switch to the Coder, fix, commit, and re-run the failed
checks until ALL CLEAR.

## Step 8: Senior self-review

**8a. Lead and specialists.** Read `.claude/agents/review-lead.md` and apply it inline
as the lead reviewer.

1. List the changed files: `git diff --name-only develop...HEAD` (use the branch's
   real base if it isn't `develop`).
2. Pick the specialist role files from the "Review specialists" table in
   `.claude/reference/project.md`. Skip files under `.implementation_plans/` and
   `.claude/`.
3. Read each specialist file and apply its checklist to the files in its domain.
4. Do the lead's cross-cutting review.
5. Produce BLOCK / WARN / NOTE findings with file:line. If the build is plan-based, rate
   every deliverable DONE / PARTIAL / MISSING.

**8b. Decision check.** Read the Accepted records listed in `docs/decisions/README.md`.
If the change touches anything an Accepted record's invariants or References cover
(when unsure, assume it does), spawn the `decision-checker` subagent (Agent tool,
`subagent_type: "decision-checker"`).

**Provide:**

- Mode: `diff`
- Repo path, branch, and base branch
- The changed-file list (`git diff --name-only <base>...HEAD`)
- The diff (`git diff <base>...HEAD`). If it's over about 3000 lines, pass only the file
  list and say the diff was too large to include.
- The phase doc path, if plan-based

Don't paste the decision records; it reads them itself.

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/decision-checker.md` and apply it inline, and say in your report
that it ran inline. If a spawn fails with a transient error, retry up to three times
before falling back.

Handle the result:

- **FLAG (blocker):** a BLOCK finding for the Fixer. If the only fix is to change the
  decision itself, stop and ask the person: reversing a decision needs a new record
  that supersedes it (see `docs/decisions/README.md`).
- **FLAG (watch):** a WARN finding.
- **CLEAR:** note it in the report.

## Step 9: Fixer

Read `.claude/roles/build/fixer.md` and adopt that role.

- **Input:** every finding from Step 8.
- Fix every BLOCK. Fix straightforward WARNs. Defer complex WARNs with a reason. NOTEs
  need no action.
- Commit the fixes and produce the Fix Report.

## Step 10: Validator (re-check)

Read `.claude/roles/build/validator.md` again and run the same checks as Step 7, to
confirm the fixes didn't break anything. Fix and re-run until ALL CLEAR.

## Step 11: Independent review (mandatory)

Never skip this step, whatever the size of the change. Steps 8-10 were done by the agent
that wrote the code: same mental model, same blind spots. A reviewer with no memory of
the build reads the code cold, as a person reviewing the PR would.

Spawn the `review-lead` subagent (Agent tool, `subagent_type: "review-lead"`).

**Provide only:**

- Repo path, branch name, and base branch
- The changed-file list (`git diff --name-only <base>...HEAD`) and the diff stats
  (`git diff --stat <base>...HEAD`)
- The specialist role files that match the changed files (the same set as Step 8a). Its
  own file is already its system prompt.
- The phase doc path, if plan-based (the spec itself, not your notes on it)
- The validation status from Step 10, for example "lint PASS, typecheck PASS, 142 tests
  passing; don't re-run mechanical checks"
- The directive: "Review this branch cold. Return BLOCK / WARN / NOTE findings, one line
  each, with file:line."

Never include your reasoning, your build decisions, earlier findings, or hints about
where to look. That contaminates the fresh read.

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/review-lead.md` and apply it inline, and say in your report that it
ran inline, so the review was not independent. If a spawn fails with a transient error,
retry up to three times before falling back.

Handle the findings:

1. BLOCKs: switch to the Fixer (Step 9 process) and commit.
2. WARNs: the Fixer's rules apply (fix if straightforward, else defer with a reason).
3. Re-run the Validator (Step 10 process).
4. Record in the final report that the independent review ran and how its findings were
   handled.

**Why this exists:** a long self-review once approved code with zero BLOCKs, and a
six-minute independent review found a production bug on its first grep. The author had
destructured a hook's return value as the wrong shape, then reviewed that same line and
saw nothing wrong. The fresh reviewer's first instinct was to open the hook and check its
return type. Self-review catches surface issues (lint, strings, tokens). Independent
review catches wiring and integration bugs.

## Step 12: Close out

**12a. Changelog.** If the change is user-visible, add one line under `## [Unreleased]`
in `CHANGELOG.md`, in the right section (Added, Changed, Deprecated, Removed, Fixed,
Security). Add lines near the top of the section only. Never rewrite or reorder older
entries, create a version heading, or bump a version (`docs/VERSIONING.md`).
Internal-only changes (refactors, CI, tests) need no entry.

**12b. Phase status** (plan-based builds only). A merged PR that leaves its phase not
marked `Done` is a defect.

1. **Phase doc:** set its Status to `Done`. Mirror the format sibling `Done` phases in
   the same plan use (for example adding today's date in UTC and the branch). If there
   is no Status section, add one after the title in that format.
2. **Plan README:** in the Phase tracker table, set this phase's status cell to `Done`.
   Change that cell only: no other rows, no other sections.

This step does not touch sibling phase docs, flip any other phase (even one this work
unblocks), write a retrospective, move the plan to `DONE/` (that happens with the
release), or push.

**12c. Story keywords and the closing commit.** Read the phase doc's `implements` list.
The plan README's Stories section says which phase finishes each story.

| Story | Keyword |
| --- | --- |
| This phase finishes it | `Closes <id>` |
| A later phase finishes it | `Refs <id>` |

- Use the ID format and "Closing a story" rule in `.claude/reference/tracker.md`, and do
  anything else that rule says the finishing change must do.
- `implements: []` (an infrastructure-only phase) gets no keywords.
- A bare mention of an ID doesn't count; only the keywords do.

Commit the Step 12 changes as one commit, `docs(<plan>): mark phase <N> done`, with the
keyword lines in its body. For an ad-hoc build that names stories, put the keywords in
the body of your final commit instead. If nothing changed in Step 12 (the doc was
already `Done`, no changelog entry needed) and the keywords are already on a commit,
skip the commit and say so in the report. If the delivery commits were already pushed
without the keywords, add them with an empty commit:
`git commit --allow-empty -m "chore: tag delivery" -m "Closes <id>"`.

The PR description repeats the same keyword lines in its Closes section.

## Step 13: Final report

Report only what you verified. A deliverable is DONE when a passing test or check proves
its acceptance criterion; a check is PASS only if you ran it.

```markdown
## Build Complete: <description>

**Phase:** <plan> phase <N>: <title> (or "Ad-hoc: <summary>")
**Branch:** <branch>
**Commits:** <count>
**Files changed:** <count>

### Deliverables
| # | Deliverable | Status |
| --- | --- | --- |
| 1 | ... | DONE / PARTIAL |

### Verification
- Lint: PASS / FAIL
- Type check: PASS / FAIL
- Tests: PASS / FAIL (X passed, Y failed; skipped: which and why)
- Other checks (story tests, cfn-lint, generated API diff): PASS / FAIL / NOT RUN (why)

### Reviews
- Self-review: <n> BLOCK, <n> WARN, <n> NOTE
- Decision check: CLEAR / FLAG (<record and invariant>) / not needed (why) [ran inline]
- Independent review: ran as subagent / ran inline (not independent); <n> BLOCK, <n> WARN

### Findings resolved
- <n> BLOCKs fixed
- <n> WARNs fixed
- <n> WARNs deferred: <finding> (<reason>)

### Stories
- Closes: <ids> / Refs: <ids> / none

### Remaining items
- <anything the person must do by hand>

### Next steps
- Run `/review` for a formal review (ask for "3 cycles" on high-risk changes)
- Open a PR against `develop` and fill in every section of the template; a person merges it
```

## Parallelization

Run independent work in parallel where you can:

- Tests and locale strings alongside the code they cover
- Independent components or independent backend and frontend pieces

Always respect dependency order:

- Constants and limits → models and migration → schemas → service → router
- Backend endpoints → `npm run gen:api` → frontend API functions → hooks → components → pages
- Types → the code that consumes them

## Error handling

- **Plan not found:** list the active plans and ask which one.
- **Prerequisites not met, or the phase is still `Draft`:** report what's missing (or that
  `/prep` hasn't passed) and ask whether to proceed.
- **A check fails and the Coder can't fix it:** stop and report the file paths and
  errors. Never skip, delete, or weaken a test, lower a coverage floor, or use
  `--no-verify` to get to green.
- **Scope too large** (the estimate is over 1000 changed lines, above size L in
  `.implementation_plans/README.md`): warn, suggest a split, and proceed only if the
  person confirms.
- **Conflicting standards:** the guides (`CLAUDE.md`, the area `Agents.md` files,
  `docs/SECURITY.md`) win over the phase doc. Follow them and say so in the report.
- **You can't ask the person** (for example inside `/offshore`): stop at the point where
  you would ask, and return the question as the blocker in your report.
