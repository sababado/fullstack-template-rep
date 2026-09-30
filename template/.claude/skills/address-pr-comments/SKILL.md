---
name: address-pr-comments
description: Work through every review comment and failing check on a pull request. Fixes each finding at its root cause, replies to every thread, resolves what's fixed, and pushes. Run it when a PR has review findings or red checks.
argument-hint: "[PR number, URL, or branch]"
disable-model-invocation: true
model: opus
---

# Address PR comments

You are addressing review comments and failing checks on a pull request. No shortcuts,
no quick fixes, no bandaids. Trace every finding to its root cause, fix it properly, and
verify the fix before you push.

The user's input (a PR number, a URL, a branch, or empty):

$ARGUMENTS

## Tools

Use the GitHub MCP tools or the `gh` CLI, whichever this session has. The repository is
the `Repository` in `.claude/reference/project.md`. Pass it on every call (`--repo` for
`gh`; `owner` and `repo` for MCP) so the calls work from any worktree.

| Operation | GitHub MCP | `gh` |
| --- | --- | --- |
| PR metadata | `pull_request_read`, method `get` | `gh pr view <n> --json number,title,body,headRefName,baseRefName,headRefOid,mergeable,mergeStateStatus` |
| Changed files | `pull_request_read`, `get_files` | `gh pr diff <n> --name-only` |
| Conversation comments | `pull_request_read`, `get_comments` | `gh api repos/<repo>/issues/<n>/comments --paginate` |
| Inline review comments | `pull_request_read`, `get_review_comments` | `gh api repos/<repo>/pulls/<n>/comments --paginate` |
| Review summaries | `pull_request_read`, `get_reviews` | `gh api repos/<repo>/pulls/<n>/reviews --paginate` |
| Thread state (resolved, outdated) | `pull_request_read`, `get_review_comments` (returns threads) | GraphQL `pullRequest { reviewThreads(first: 100) { nodes { id isResolved isOutdated path line comments(first: 50) { nodes { databaseId author { login } body createdAt } } } } }` |
| Checks | `pull_request_read`, `get_check_runs` | `gh pr checks <n>` |
| Failed job logs | `get_job_logs` with `run_id` and `failed_only` | `gh run view <run-id> --log-failed` |
| Reply on an inline thread | `add_reply_to_pull_request_comment` | `gh api repos/<repo>/pulls/<n>/comments -X POST -f body=<reply> -F in_reply_to=<comment-id>` |
| Reply in the conversation | `add_issue_comment` | `gh pr comment <n> --body <reply>` |
| Resolve a thread | `resolve_review_thread` with the thread node ID | GraphQL `resolveReviewThread(input: {threadId: "<id>"})` |

A transient error (HTTP 5xx, a timeout, "please try again") is not a stop condition.
Retry with backoff (2s, 4s, 8s, 16s) before you report it.

## Step 1: Identify the PR

1. From `$ARGUMENTS`, accept a URL, `#123`, `123`, or a branch name.
2. If it is empty, use the open PR for the current branch.
3. If no PR is found, stop and tell the user. Don't guess.

Confirm the PR with the user only when the input was ambiguous (several matches).

## Step 2: Inventory everything

Gather inputs; don't fix anything yet. Run the reads in parallel.

**2a. Metadata and scope.** Read the PR metadata and the changed files. Note the base
branch. A PR from `develop` into `staging` or `main` is a release PR: many commits, many
authors, many areas. Treat it as a whole, not as one feature.

**2b. All four comment surfaces.** Read every one: conversation comments, inline review
comments, review summaries, and review threads with their resolved and outdated state.
Findings hide in each.

**2c. CI checks.** List the checks. For each failing one, read its log.

**2d. Punch list.** Build one table and work through it:

| # | Source | File:line | Author | Summary | Resolved? | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | inline | `apps/backend/src/features/notes/service.py:42` | review bot | ... | unresolved | FIX |

Decisions:

- **FIX:** a real issue. The default for anything substantive.
- **EXPLAIN-ONLY:** the comment is wrong, or the fix is worse than the issue. Needs a
  written justification that you post as a reply.
- **ALREADY-FIXED:** verify by reading the current code on this branch. If it really is
  fixed, reply and resolve.

Skip only:

- resolved threads whose fix is in HEAD (verify, don't assume);
- outdated threads on deleted lines (verify);
- acknowledgments with no actionable content ("LGTM").

Don't skip a comment because it is old, because it's from a bot, or because it looks
minor. A magic number flagged weeks ago is still a magic number.

Deduplicate before you count. The same finding can arrive twice under two logins (for
example the review bot and `github-actions`). Dedupe by path, line, and body, or you will
fix once, reply twice, and miscount the round.

## Step 3: Read the codebase before you fix

For every FIX item, before you write code:

1. Read the whole file the comment targets, not just the lines.
2. Read the related files: callers, callees, tests, schemas, types.
3. Search for the same pattern elsewhere. If the issue exists in five other files, all
   six get fixed. Fix the rule, not the instance.
4. Read the area guide for the workspace (see `.claude/reference/project.md`),
   `docs/SECURITY.md`, and any relevant record in `docs/decisions/`. Cite the convention
   in your commit and reply, not just the symptom.

This step is not optional. Skipping it is how shortcuts happen.

## Step 4: Address each item

**FIX items**

1. Change the root cause, not the place where the symptom showed up.
2. Apply the same fix to every other instance of the pattern.
3. Add or update a test that would have caught the original issue, when one is feasible.
4. Run the checks for the workspace you touched (see `.claude/reference/project.md`)
   before you move to the next item. Run them without asking.

**EXPLAIN-ONLY items**

1. Write the justification: what you considered, why you made no change, and what would
   change your mind.
2. Never dismiss a comment silently. A reply is required.
3. Post it as a threaded reply to the original comment, not as a new top-level comment.

**ALREADY-FIXED items**

1. Confirm by reading the current file in HEAD.
2. Reply with the commit or line that fixed it, then resolve the thread.

Resolve threads wherever you can: FIX threads once the fix is pushed (Step 8),
ALREADY-FIXED threads when you reply. Leave an EXPLAIN-ONLY thread open when a person
wrote it, so they can answer.

## Step 4a: Don't flip-flop

Review is a conversation, not a directive. Review bots often contradict their own earlier
comments across rounds: switch `.value` to a literal in round 1, back to the enum in round
3, `.value` again in round 5. Each oscillation costs a commit, a CI run, a review round,
and the user's trust.

**Track decisions per location.** For every location you change in response to a
comment, note the lines, the state they landed in, and a one-sentence reason. When a
later round flags the same location, check your notes first.

**When a finding contradicts a decision you already defended.** This applies only when
you changed and defended the lines in writing on this PR (a reply on the thread, or an
earlier thread on the same lines):

1. Keep the current state by default. Don't apply the change.
2. Check that it really is a contradiction and not a new concern at the same line.
3. Reply once: the position is locked, the state it's in, the round that set it (link
   the comment), and what would change your mind (a concrete bug or failure mode, not a
   style preference).
4. Don't push a no-op commit for it. A push re-triggers the review and starts another
   round.

A first finding on untouched code is a normal comment: judge it on its merits.

**Two-round cap on style-only findings** (both forms work: no behavior difference, no
bug, no failing test):

- Round 1: make the change if it is a clear improvement, or push back briefly.
- Round 2 (the bot reverses or asks again): lock whatever state the code is in and reply
  pointing at round 1. Don't change it again.

Pick the form most consistent with the surrounding code (search for it), commit to it,
and defend it.

**Stale duplicates.** Bots re-flag code that is already fixed. Before applying a finding,
search the current branch for the pattern. If the issue isn't there, reply with the
evidence and move on. Don't "apply" a fix that is already in place.

**What reopens a locked decision:** a new, concrete failure mode (a bug, a security gap,
a failing test); a real change in the repo's convention (a new rule in an area guide);
or the user telling you to. A restated preference or "more idiomatic" is not enough.

**If you notice you've been ping-ponging:** stop, post one PR comment laying out the
round-by-round history, lock the state that best matches the surrounding code, and don't
change it again this session.

## Step 5: Address failing checks

For each failing check from Step 2c:

- **Tests:** fix the test or the code, whichever is wrong. Never skip, `xfail`, or delete
  a test to get green.
- **Lint:** fix the code. Never disable the rule (`eslint-disable`, `# noqa`).
- **Types:** fix the types. Never cast past them (`any`, `# type: ignore`).
- **Build:** find the root cause (missing dependency, wrong import, version mismatch).
  Never delete the failing step.
- **Coverage:** add real tests. Never lower a coverage floor.

If a check fails for an unrelated reason (a flake, an outage, a third-party rate limit),
re-run it rather than ignoring it, and note it in the final report.

**Two-blind-commits cap.** If you can't read a failing check's log, you may push at most
two diagnostic commits to surface it (step markers, exit codes, verbose flags). If
neither reveals the root cause, stop pushing and ask the user for the log in your
report. Don't shotgun-debug a workflow file. If diagnostic commits did help, revert them
in one cleanup commit before you finish so the PR diff stays clean.

## Step 6: Self-review before you push

1. `git status`: only the intended files changed.
2. `git diff`: read every line you are about to ship. No debug prints, no commented-out
   code, no stray `console.log` or `print()`.
3. Re-run the checks for every workspace you touched.
4. Every punch-list item has an entry: a commit, a reply, or both.

## Step 7: Commit and push

Make focused commits, one logical change each, in the repo's Conventional Commits style
(see `git log --oneline -20`). The body says why and which comments the commit addresses.

If a pre-commit hook fails, fix the cause and make a new commit. Never `--no-verify`, and
never `--amend` to paper over a hook failure.

Review-fix commits don't carry a closing keyword (`Closes <story>`). That belongs in the
PR description or the original delivery commit (see "Closing a story" in
`.claude/reference/tracker.md`); repeating it on every fix commit can re-trigger tracker
automation.

Push to the PR's head branch. Never push to `develop`, `staging`, or `main`, and never
merge the PR.

## Step 8: Let the push re-trigger the review

If the project has `.github/workflows/claude-review.yml`, every push to a PR that isn't a
draft re-runs the review on its own. There is no re-review comment to post.

**Never push an empty or no-op commit to force a review.** A round that changed no code
(you only replied and defended) gets no new review. That is fine; say so in the report.

After the push, reply on each FIX thread with the commit that fixed it and resolve the
thread.

**Confirm the review actually ran.** A green `review` check alone is not evidence:

- The review action skips itself, and still reports success, on a PR that edits its own
  workflow file, because that file must match the copy on the default branch.
- A newer push cancels a running review. A `cancelled` conclusion means "wait for the
  newer run", not "clean".

The review is done when the `review` check has concluded and a review-bot comment
(`claude[bot]`) exists whose update time is later than the head commit's time. The bot
edits that comment in place: it starts as a progress checklist and ends with a finished
line, so unchecked boxes mean it is still running.

Wait by polling the checks and comments every minute or two; don't end your turn asking
the user to ping you, and don't rely on a webhook subscription alone (they can drop
events). If a poll fails, retry it.

When the new review lands, read it. New findings start a new round at Step 2, with
Step 4a applied. You are done when a round leaves nothing to fix (only defended,
locked findings at most), the checks are green, and every thread has a fix or a reply.

## Step 9: Report

End with a summary under 200 words; the user can read the diff:

```
PR #<num>: <title>
Base: <base>  Head: <head>  New HEAD SHA: <sha>

Addressed:
  - N FIX items across <workspaces>
  - N EXPLAIN-ONLY items (replies posted)
  - N ALREADY-FIXED items (threads resolved)

Failing checks fixed:
  - <check>: <root cause and fix>

Could not fix:
  - <item>: <reason>

Pushed: <count> commits.
Review re-triggered by push: <yes | no — defend-only round>
```

## Hard rules

- No `--no-verify`, `--amend`, `--force`, `git reset --hard`, or branch deletes. If a
  hook fails, fix the cause.
- No skipped tests, lowered coverage, or disabled lint rules to make CI green.
- No silent dismissal. Every comment gets a fix or a written reply.
- No assumptions. Read the file, search for the pattern, verify the fix on this branch.
- Project scope, not file scope. Fix the rule, not the instance.
- Run lint and tests without asking.
- Never push an empty or no-op commit to re-trigger a review.
- Confirm the review ran on the new head before you call the PR clean; a green `review`
  check alone doesn't prove it.
- No flip-flopping. Two rounds at most on a style-only finding; then lock and defend.
- Never merge the PR, and never push to `develop`, `staging`, or `main`.
