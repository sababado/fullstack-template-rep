#!/usr/bin/env bash
# Tests for .claude/hooks/guardrails.sh. Rerun any time:
#   bash .claude/hooks/test-guardrails.sh
#
# Builds throwaway git repos in a temp directory, pipes PreToolUse payloads into the
# hook with and without the .offshore/active sentinel, and checks the exit codes
# (0 = allow, 2 = block). Needs bash, git, and jq. Exits non-zero if any case fails.

set -euo pipefail

HOOK="$(cd "$(dirname "$0")" && pwd)/guardrails.sh"
command -v jq >/dev/null 2>&1 || { echo "jq is required to run these tests" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Project repo on a feature branch; a second repo checked out on develop.
PROJECT="$TMP/project"
ON_DEVELOP="$TMP/on-develop"
for repo in "$PROJECT" "$ON_DEVELOP"; do
  git init -q "$repo"
  git -C "$repo" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
done
git -C "$PROJECT" checkout -q -b feature/notes-sharing
git -C "$ON_DEVELOP" checkout -q -b develop

PASS=0
FAIL=0

# run <expected exit> <label> <payload JSON> [sentinel on|off] [PATH override]
run() {
  local expected=$1 label=$2 payload=$3 sentinel=${4:-on} path=${5:-$PATH} actual
  rm -rf "$PROJECT/.offshore"
  if [ "$sentinel" = on ]; then
    mkdir -p "$PROJECT/.offshore"
    : >"$PROJECT/.offshore/active"
  fi
  set +e
  printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$PROJECT" PATH="$path" "$BASH" "$HOOK" 2>"$TMP/stderr"
  actual=$?
  set -e
  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS + 1))
    printf 'PASS  exit %s  %-8s %s\n' "$actual" "[$sentinel]" "$label"
  else
    FAIL=$((FAIL + 1))
    printf 'FAIL  exit %s (want %s)  %-8s %s\n' "$actual" "$expected" "[$sentinel]" "$label"
    sed 's/^/      stderr: /' "$TMP/stderr"
  fi
}

bash_payload() { # $1: command, $2: cwd (default: the project repo)
  jq -nc --arg c "$1" --arg d "${2:-$PROJECT}" '{tool_name: "Bash", tool_input: {command: $c}, cwd: $d}'
}

block() { run 2 "$1" "$(bash_payload "$1" "${2:-}")"; }
allow() { run 0 "$1" "$(bash_payload "$1" "${2:-}")"; }

echo "== Blocked while a run is active"
block 'git push origin main'
block 'git push origin develop'
block 'git push -u origin HEAD:main'
block 'git push origin feature/x:refs/heads/staging'
block 'git push origin :develop'
block 'git push origin --delete main'
block 'git push origin --all'
block 'git push' "$ON_DEVELOP"
block 'git add -A && git commit -m "wip" && git push origin main'
block 'git -C .. push origin main'
block 'echo "$(git push origin main)"'
block 'git push --force origin feature/notes-sharing'
block 'git push -f origin feature/notes-sharing'
block 'git push origin +feature/notes-sharing'
block 'git commit --no-verify -m "wip"'
block 'git commit -n -m wip'
block 'git commit -anm wip'
block 'git -c core.hooksPath=/dev/null commit -m wip'
block 'git config core.hooksPath /dev/null'
block 'git reset --hard HEAD~1'
block 'git commit --amend --no-edit'
block "$(printf 'git commit --amend -m "$(cat <<'"'"'EOF'"'"'\nfix: typo\nEOF\n)"')"
block 'gh pr merge 12 --squash'
block 'gh -R acme/app pr merge 12'
run 2 'AskUserQuestion tool' '{"tool_name":"AskUserQuestion","tool_input":{"questions":[]}}'
run 2 'GitHub merge tool' '{"tool_name":"mcp__github__merge_pull_request","tool_input":{"pullNumber":12}}'

echo "== Allowed while a run is active"
allow 'git push --force-with-lease origin feature/notes-sharing'
allow 'git push -u --force-with-lease origin "feature/$PLAN_NAME"'
allow 'git push origin develop:feature/fix'
allow 'git push origin feature/main-fix'
allow 'git push --delete origin feature/old-spike'
allow 'git push'
allow 'git push origin HEAD'
allow 'git commit -m "don'"'"'t use --no-verify"'
allow 'git commit -m "Fix --amend handling; never git push origin main --force"'
allow "$(printf 'git commit -F - <<'"'"'EOF'"'"'\nfix: stop using --no-verify\n\ngit push origin main is blocked now\nEOF')"
allow "$(printf 'git commit -m "$(cat <<'"'"'EOF'"'"'\nchore: explain --amend and reset --hard\nEOF\n)"')"
allow 'git reset --soft abc1234'
allow 'git log --oneline origin/develop..HEAD'
allow 'echo "git push origin main --force"'
allow 'grep -rn -- "--no-verify" docs/'
allow 'git config --get core.hooksPath'
allow 'gh pr view 12 --json state'
allow 'npm test -- --reporter=dot'
run 0 'Agent spawn (logged)' '{"tool_name":"Agent","tool_input":{"subagent_type":"general-purpose","description":"Phase phase-1-notes-api","prompt":"..."}}'
run 0 'malformed JSON' 'this is not json'
run 0 'empty payload' ''

echo "== Allowed when no run is active (no sentinel)"
run 0 'git push origin main' "$(bash_payload 'git push origin main')" off
run 0 'git commit --amend' "$(bash_payload 'git commit --amend')" off
run 0 'AskUserQuestion tool' '{"tool_name":"AskUserQuestion","tool_input":{}}' off

echo "== Allowed (with a logged warning) when jq is missing"
NOJQ="$TMP/nojq-bin"
mkdir -p "$NOJQ"
for tool in cat date git tr dirname; do
  ln -s "$(command -v "$tool")" "$NOJQ/$tool"
done
run 0 'git push origin main, no jq on PATH' "$(bash_payload 'git push origin main')" on "$NOJQ"
grep -q 'WARN jq not found' "$PROJECT/.offshore/guardrails.log" \
  && echo "PASS  guardrails.log has the missing-jq warning" \
  || { echo "FAIL  no missing-jq warning in guardrails.log"; FAIL=$((FAIL + 1)); }

echo "== Logs"
rm -rf "$PROJECT/.offshore"
mkdir -p "$PROJECT/.offshore"
: >"$PROJECT/.offshore/active"
bash_payload 'git push origin main' | CLAUDE_PROJECT_DIR="$PROJECT" "$BASH" "$HOOK" 2>/dev/null || true
bash_payload 'git push origin feature/notes-sharing' | CLAUDE_PROJECT_DIR="$PROJECT" "$BASH" "$HOOK"
printf '%s' '{"tool_name":"Agent","tool_input":{"subagent_type":"general-purpose","description":"Integration gate"}}' |
  CLAUDE_PROJECT_DIR="$PROJECT" "$BASH" "$HOOK"
sed 's/^/  guardrails.log: /' "$PROJECT/.offshore/guardrails.log"
sed 's/^/  agents.log:     /' "$PROJECT/.offshore/agents.log"
if grep -q 'BLOCK tool=Bash git push to main' "$PROJECT/.offshore/guardrails.log" &&
  grep -q 'ALLOW tool=Bash' "$PROJECT/.offshore/guardrails.log" &&
  grep -q 'Integration gate' "$PROJECT/.offshore/agents.log"; then
  echo "PASS  decisions and spawns are logged"
  PASS=$((PASS + 1))
else
  echo "FAIL  expected log lines are missing"
  FAIL=$((FAIL + 1))
fi

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
