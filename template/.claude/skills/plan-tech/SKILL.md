---
name: plan-tech
description: "Turns an epic in the tracker (or a feature description) into a phased implementation plan in .implementation_plans/<plan>/, with each phase sized to one reviewable PR and mapped to the stories it implements. Run it after /plan-product and before /prep. Pipeline step: run it when a person types the command or /offshore calls it, not for ordinary requests."
argument-hint: "<epic reference or name | story ID | feature description>"
model: fable
effort: high
---

# /plan-tech

You are the technical planning orchestrator. You take an epic (or a feature description),
research the codebase, and write a phased implementation plan in
`.implementation_plans/<plan-name>/` that follows `.implementation_plans/README.md`.

`/plan-product` defines *what* users will be able to do: the epic and its stories in the
tracker. `/plan-tech` defines *how* the team builds it: phases, each one PR. Every phase
lists the stories it contributes to in `implements:`.

You reach the tracker only through the numbered operations in
`.claude/reference/tracker.md`, and you never write to it. You write plan files only, never
code.

Read these first: `CLAUDE.md`, `.claude/reference/project.md`,
`.claude/reference/tracker.md`, `.implementation_plans/README.md`.

The user's input:
$ARGUMENTS

---

## Step 0: Resolve the epic and its stories

### 0a. Find the epic

1. If the input names an epic (reference, URL, or name), resolve it with tracker operation 1
   (Search epics). If it names a story, fetch it with operation 4 (Fetch story) and take its
   epic.
2. If a plan folder with a matching name exists in `.implementation_plans/`, read its
   README front matter for the key named under "Plan front matter" in `tracker.md`.
3. If the input is only a feature description, run operation 1 with its keywords and show
   the candidates.

Then:

- **The user named an epic and it isn't found:** stop. "Epic `<ref>` not found. Check the
  reference and rerun." Don't fall back to planning without stories; a typo must not look
  like new work.
- **Several plausible matches:** list them and ask. Don't pick one.
- **A description and no matching epic:** stop and ask:

  ```
  No epic matches "<one-line summary>". Options:
   (a) Run /plan-product first to write the epic and its stories (recommended).
       Type "cancel".
   (b) Plan without stories. Every phase gets `implements: []`, and /prep can't check
       story coverage. Type "no stories".
  ```

- **One epic:** record its reference in the format `tracker.md` gives and go on.

### 0b. Fetch the stories

Run operation 5 (List epic stories).

- **Cap: 100 stories.** This is a ceiling, not pagination. If the epic has more, stop:
  "Epic `<name>` has more than 100 stories. Plans this large should be split; split the
  epic with /plan-product first."
- For each story, record its ID, title, persona, priority, size, whether it's closed
  (operation 7), its acceptance criteria, and its Notes. A note like "Requires new UI kit
  component: <name>" tells you a UI kit deliverable is needed.

### 0c. Confirm scope

```
Epic "<name>" (<reference>) has N stories:
  <ID>  As a <persona>, I want ...   (priority: must, size: M)
  <ID>  As a <persona>, I want ...   (priority: should, size: S)
  ...
These are the source of truth for `implements:` in every phase.
Type "continue" to proceed, or describe scope changes.
```

Wait for "continue". Treat any other reply as feedback. If the user says a story is
missing, send them to `/plan-product --epic <ref>`; don't invent stories here.

### 0d. Existing plan

If `.implementation_plans/<plan-name>/` already has phase documents, never overwrite them
silently. Ask:

```
Plan "<name>" already has N phase documents. Options:
 (a) Extend it: add phases for new stories after the existing ones. Type "extend".
 (b) Rewrite it: regenerate every phase document. Type "rewrite".
 (c) Cancel. Type "cancel".
```

Rewriting is destructive: require the literal word "rewrite". A README with no phase
documents (for example the epic README a file-based tracker keeps; see `tracker.md`) is
not an existing plan: keep its front matter, summary, and out-of-scope list, and add the
plan sections to it.

---

## Step 1: Parse the request

You need at least **what** the feature does and **who** uses it (personas from
`project.md`). If the input and the stories don't give you that, ask. Otherwise extract
answers to the lead's five questions (Step 3), infer reasonable defaults for gaps, and list
every assumption for the user to confirm at the approval gate.

---

## Step 2: Research

### 2a. The codebase

1. **Related features:** look in `apps/backend/src/features/`,
   `apps/frontend/src/features/`, and `docs/feature-map.md`. Do models, schemas, routes,
   or pages for this domain already exist?
2. **UI kit:** `packages/ui-kit/src/index.ts` exports every component. Decide whether the
   screens can be composed from them.
3. **Other plans:** check `.implementation_plans/` for overlapping plans.
4. **Authorization:** read `apps/backend/src/core/auth.py` (`CurrentPrincipal`,
   `require_group`) and the personas in `project.md`. Does the feature need a group
   restriction, or only caller scoping?
5. **Decisions:** read the index in `docs/decisions/README.md` and the invariants of every
   `Accepted` record the feature could touch.

### 2b. Related work

Run operation 1 with the feature's keywords, and skim the READMEs of active plans in
`.implementation_plans/`. Look only for direct relationships: work this plan depends on,
work it gates, or work that changes the same models, routes, or pages.

- Skim names and summaries. Don't read every epic in full.
- Spend about a minute. Don't block on it.
- `/plan-product` already checked for overlap; this is not a second overlap analysis.

**Output:** 2-5 bullets, each naming the epic or plan, the relationship (depends on /
gates / shares code with), and what it means for phasing. If nothing is related, write "No
related work found." This goes into the README's Dependencies section under "Related
work". It is context, not a constraint: the code is the source of truth.

---

## Step 3: Architect the plan

Read `.claude/roles/plan/lead.md` and adopt that role.

1. **Answer the five questions** (problem, users, data, systems touched, security).
2. **Scope the domains:** backend, frontend, and only when needed ui-kit, infra, or docs.
3. **Break the work into phases:** data layer, then API, then frontend. Each phase is
   roughly 300-1000 changed lines and ships on its own: checks pass and the product works.
4. **Map `depends_on`** between phases (sequencing).
5. **Compute the file-overlap matrix** (parallelism). This is separate from `depends_on`:
   two phases with no dependency can still write the same files. Phases labeled
   "independent" have written to the same feature folder (a shared `index.ts`, locale file,
   or types) and cost hours of merge-conflict resolution with no time saved over running
   them one after the other. Prevent it here:
   - For each pair of phases with no `depends_on` path between them, compare their "Files
     to create" and "Files to modify" lists.
   - If any path appears in both, mark the pair **sequential-only**. Watch for the files
     every feature touches: under `apps/frontend/src/`, the feature's `index.ts`,
     `core/i18n/locales/en/<namespace>.ts`, `core/i18n/resources.ts`,
     `core/i18n/locales/en/errors.ts`, `router.tsx`, and `core/layouts/AppLayout.tsx`;
     `apps/backend/src/app.py`; and the generated
     `apps/backend/openapi.json` and `apps/frontend/src/core/api/schema.d.ts` (any two
     phases that change the API both regenerate them).
   - Two phases that each add an Alembic migration are sequential-only: they would take the
     same `--rev-id` and leave two migration heads.
   - Append-only files (`CHANGELOG.md`, `docs/feature-map.md`) conflict trivially. List them,
     but don't mark a pair sequential-only for them alone.
   - Different domains are not proof of safety: a backend phase and a frontend phase can
     share `packages/shared` or the generated API types.
   - The file lists are intent, not a contract; whoever runs phases in parallel checks
     again at run time. Both checks together catch what one misses.

### Decision check

If the design touches anything an `Accepted` decision record's invariants cover (you read
them in Step 2a), spawn the `decision-checker` subagent (Agent tool,
`subagent_type: "decision-checker"`). When in doubt, spawn it.

**Provide:**
- The proposed phase breakdown: each phase's goal and its files to create or modify
- The key design choices: data model, new routes, new AWS resources, new dependencies
- The repository root

If the Agent tool isn't available to you (for example inside an `/offshore` sub-agent),
read `.claude/agents/decision-checker.md` and apply it inline, and say in your report that
it ran inline.

It returns CLEAR or FLAG. A **blocker** FLAG stops phase-document generation until the user
decides: change the design, or write a new decision record that supersedes the old one
(see `docs/decisions/README.md`). A **watch** FLAG goes into the affected phase's Security
checklist so the implementer respects it. Never write phase documents that bake in a design
a blocker FLAG rejects.

### Acceptance-criteria allocation

For every story, decide which phase finishes it and which phases contribute. An AC that
needs data to be stored (for example "Given a note was edited, then it shows who edited it
and when") belongs in the earliest phase that touches that model. A later list or report
phase can't fix its own data dependency after the fact.

### Approval gate

Present the breakdown and wait for approval before writing any phase document:

```markdown
## Proposed plan: <plan-name>

| Phase | Title | Domain | Size | Depends on | Implements |
| --- | --- | --- | --- | --- | --- |
| 1 | <title> | backend | M (~500) | none | <IDs> |
| 2 | <title> | frontend | L (~800) | 1 | <IDs> |

**Parallelism:** <pair>: parallel-safe | sequential-only (<shared paths>)
**UI kit:** none needed | <component>, because <reason>
**Story allocation:** <ID> finished by phase <N>; data-model AC "<text>" in phase <N>
**Decision check:** CLEAR | FLAG <blocker/watch>: <summary> | not needed (<reason>)
**Related work:** <bullets from Step 2b>
**Assumptions to confirm:** <list>
```

Treat any reply other than approval as feedback: revise and present again.

---

## Step 4: Write the phase documents

After approval, have the matching planner role write each phase. Read the role file every
time you switch roles; don't work from memory.

| Phase domain | Role | It produces |
| --- | --- | --- |
| `backend` | `.claude/roles/plan/backend.md` | Models, migration, schemas, errors, service, routes, tests |
| `frontend` | `.claude/roles/plan/frontend.md` | API module, hooks, components, pages, route, i18n, tests |
| `ui-kit` | `.claude/roles/plan/ui-kit.md` | Component justification (required), props, variants, stories, tests, export |
| `fullstack` | backend, then frontend | Both parts. Prefer sub-phases (`1a` backend, `1b` frontend) when each fits the size rule. |
| `infra`, `docs` | the lead | AWS template or doc changes; `infra` phases use the AWS templates checks from `project.md` |

For each phase: read the role file and adopt that role. Give it the phase's goal, its
prerequisites, what the next phase needs from it, the cross-cutting requirements (groups,
error codes, i18n namespace, field limits), and the stories and ACs it implements. The
document wrapper (front matter and section order) comes from the lead role.

### Cross-cutting review

When the plan spans more than one domain, read `.claude/roles/plan/lead.md` again and run
its cross-cutting checklist across all phases. Fix the gaps in the phase documents before
you write them. If every item passes, say so in one line.

### Phase front matter

Every phase document starts with this block (the example in `.implementation_plans/README.md`
shows this project's story ID format):

```yaml
---
phase_id: 2a
title: Note sharing API
implements: [<story IDs>]
depends_on: [1]
domain: backend
estimated_size: M
---
```

Validate every value before writing. Never coerce a bad value silently; stop and ask.

| Field | Rule |
| --- | --- |
| `phase_id` | Taken from the file name `phase-<id>-<slug>.md`; must match `[0-9]+[a-z]*(-[ivx]+)?`. Rename the file if it doesn't. |
| `title` | Matches the phase's row in the README phase tracker. |
| `implements` | A list of story IDs. Each element's string form matches the "Story ID format" regex in `tracker.md`, and each ID was fetched in Step 0b. `[]` when the phase finishes no story (see below). |
| `depends_on` | A list of `phase_id`s in this plan only. Use the transitive reduction: if phase 3 needs 1 and 2, and 2 already needs 1, write `[2]`. Dependencies on other plans go in the README's Prerequisites. |
| `domain` | Exactly one of `backend`, `frontend`, `ui-kit`, `fullstack`, `infra`, `docs`. |
| `estimated_size` | Exactly one of `S` (under 300 lines), `M` (300-700), `L` (700-1000). Over 1000 means split the phase. |

### `implements` decision tree

`implements` drives story coverage checks in `/prep`, so never guess.

1. **Build candidates.** A backend phase: stories whose AC mentions the endpoint, the data it
   returns, or a user action that needs it. A frontend phase: stories whose AC mentions the
   page, the flow, or a UI element this phase builds. A `ui-kit`, `infra`, or `docs` phase:
   usually `[]`.
2. **Score each candidate.** A **confident match** has two or more AC bullets this phase
   delivers. A **possible match** has exactly one. Zero matching bullets: not a candidate.
3. **Decide.**
   - Only confident matches: write them without asking.
   - Any possible match, **or** no candidates for a phase whose domain is `backend`,
     `frontend`, or `fullstack`: stop and show the scoring as a table. Wait for the user to
     reply with an explicit list (or `[]`). Don't make a best guess and add a comment.
   - No candidates and domain `ui-kit`, `infra`, or `docs`: write `implements: []` without
     asking, and list it in the final report.

### Story check at write time

Before writing each phase document, fetch every ID in its `implements` again with
operation 4 and confirm with operation 6 (Story belongs to epic?) that it belongs to this
plan's epic.

- **Not found or wrong epic:** don't write that phase document. Report: "Phase <id>
  (`<file>`): story `<ID>` not found / belongs to another epic. Verify and rerun." Step 0b
  should have caught this; find out why (a deleted story, stale input) before retrying.
  Phase documents that don't reference the failing story may still be written, and the
  final report lists what was skipped.
- **Tracker unreachable** (after the retries in `tracker.md`): write the document, since the
  IDs were fetched in Step 0b, and note "not re-verified: tracker unavailable" in the report.

### Collect for the final report

- Each phase, its `implements`, and a one-line justification
- Every phase with `implements: []`, with its domain, so the user can confirm it's intended
- **Orphaned stories:** story IDs in no phase's `implements`. Flag them loudly: either a
  phase is missing or the story is out of scope for this plan.
- Story IDs in more than one phase with overlapping ACs (possible duplicate work)

---

## Step 5: Write the plan files

```
.implementation_plans/<plan-name>/
  README.md
  phase-1-<slug>.md
  phase-2-<slug>.md
  ...
```

- **Plan name:** kebab-case, descriptive, short (`note-sharing`, `admin-audit-log`). No
  "plan" or "implementation" in the name.
- **Phase files:** `phase-<N>-<slug>.md`; sub-phases `phase-<N>a-<slug>.md`,
  `phase-<N>b-<slug>.md`.
- **Status:** the README and every phase document start as `Draft`. `/prep` marks a phase
  `Ready`.
- The README's Status section includes `Created: YYYY-MM-DD` with today's date.

### README front matter

```yaml
---
plan: <plan-name>
<the key and value from "Plan front matter" in tracker.md>
---
```

- The block occupies the first lines of the file: `---` on line 1, no leading blank lines,
  no BOM. The `# <Feature name>: implementation plan` heading follows after one blank line.
- If the README already starts with `---`, parse that block, merge in the new values (new
  values win), and rewrite it. If the existing YAML is malformed, stop and report; never
  overwrite a hand-edited block you can't parse.
- If the user chose "no stories" in Step 0a, write only `plan:`. Never write an empty or
  `null` epic key.

---

## Step 6: Present the result

```markdown
## Plan created: <feature name>

**Location:** `.implementation_plans/<plan-name>/`
**Epic:** <name> (<reference or link>) | none (planned without stories)

### Phases
1. **Phase 1: <title>** (<domain>, ~<lines> lines) `implements: [<IDs>]`: <justification>
2. **Phase 2: <title>** (<domain>, ~<lines> lines) `implements: [<IDs>]`: <justification>

### Story coverage
- Phases with `implements: []`: <list with domains, or "none">
- Orphaned stories: <list, or "none">
- Stories in more than one phase: <list, or "none">
- Not written or not re-verified: <list with reasons, or "none">

### Key decisions
- <assumptions made, trade-offs chosen, decision-check result, anything run inline>

### Next step
Run `/prep <plan-name>` to check phase 1 against the codebase before `/build`.
```

Story status in the tracker changes when PRs use the closing keywords in `tracker.md`;
`/plan-tech` doesn't touch it.

---

## Rules

- **Read the role file before writing each phase.** The roles hold the patterns and
  checklists; don't rely on memory.
- **Phase size matters.** Over ~1000 lines: split. Reviewable PRs are not negotiable. Don't
  create micro-phases either; combine small related changes.
- **Compose before you create.** Build screens from existing UI kit components. When one
  is missing, the frontend guide says to add it to the kit rather than style raw elements:
  a single new component is a `**UI kit:**` deliverable in the frontend phase that needs it;
  a separate `ui-kit` phase is for larger work.
- **Frontend holds the business logic; the UI kit holds presentation.** Don't blur the line.
- **Read existing code first.** Don't plan what already exists, and don't plan schemas that
  conflict with existing models.
- **The guides win.** `CLAUDE.md`, the area `Agents.md` files, and `docs/SECURITY.md`
  outrank the plan. If they conflict, change the plan.
- **No tracker writes.** Phases point at stories through `implements:`; nothing is written
  back to the tracker.
