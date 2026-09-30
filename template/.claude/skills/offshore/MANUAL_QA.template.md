# Manual QA: <plan title>

Manual acceptance steps for `feature/<plan>`, organized by story so each check maps back
to <story IDs, in the format from `.claude/reference/tracker.md`>.

> **Automated coverage** already passed the integration gate: <passing-test counts per
> workspace from the checkpoint, for example "API 412 (unit and integration, on a real
> Postgres), Web app 230, UI kit 180 plus stories, Shared TS 40">. <Name any suite that
> was skipped, and why, instead of giving it a number.> The steps below cover the
> user-facing behavior a person should confirm in a browser before merging.

## Prerequisites

<!-- Derive these from what the stories touch. List only what the steps need. -->

- Accounts: <which personas from `.claude/reference/project.md` to sign in as, for
  example an `admin` and a `user`, plus an account without the permission, to check
  that it's refused>.
- Data: <records the steps depend on, and how to create them>.
- Setup: <how to run the app locally, for example `npm run dev`, and any env values>.
- Themes: light and dark.
- Viewports: mobile (375px), tablet (768px), desktop (1280px).

---

## <story ID>: <story title> (phases <…>)

1. <One concrete action, naming the real route, role, or button> → <expected result>.
2. <Action> → <expected result>.
3. <Action> → <expected result>. <Call out a regression this fixes, where relevant.>

## <story ID>: <story title> (phases <…>)

4. <Action> → <expected result>.
5. <Action> → <expected result>.

## <story ID>: <story title> (phases <…>)

No user-facing surface; automated tests cover it.

---

## Automated re-run (optional)

```bash
# The full check suite from .claude/reference/project.md
<commands>
```

<!--
Manual QA rules. Keep them.

- Organize by story, not by phase. Under each story heading, name the phases that
  deliver it (from the Stories table in the plan README).
- Number steps continuously across the whole doc, so a reviewer can say "step 14".
- Each step is one concrete action and its expected result. No "verify it works".
  Name the real routes, roles, buttons, endpoints, and error codes the diff ships;
  never invent behavior the diff doesn't show.
- The Automated coverage note cites the real counts from the integration gate. A
  skipped suite is named, not numbered.
- Cover every story with a user-visible surface. A purely internal story gets the
  one-line "covered by automated tests" note.
- /offshore writes this doc; it doesn't run it. Don't add pass/fail columns that imply
  the steps were run. The person runs them during review.
-->
