#!/usr/bin/env bash
# PreToolUse guardrail for unattended /offshore runs.
#
# Active only while .offshore/active exists at the project root. The /offshore skill
# creates that file when a run starts and deletes it when the run ends, so in a normal
# session this hook allows everything.
#
# While active it blocks these calls (exit code 2; the message on stderr tells the
# agent what to do instead):
#   - git push to develop, staging, or main: plain names, refspecs (HEAD:main,
#     x:refs/heads/develop), deletes (:develop, --delete main), --all/--mirror, and a
#     push with no refspec while one of those branches is checked out
#   - bare force pushes: --force, -f, or a +refspec (--force-with-lease is allowed)
#   - hook bypass: --no-verify, git commit -n, core.hooksPath overrides
#   - git reset --hard
#   - git commit --amend
#   - merging a pull request: gh pr merge, and the GitHub merge tools
#   - the AskUserQuestion tool
#
# Quoted strings are neutralized and heredoc bodies dropped before matching, so a
# commit message that mentions a flag ("don't use --no-verify") is not a flag.
#
# Logs: .offshore/guardrails.log (every decision), .offshore/agents.log (Agent spawns).
# Exit codes: 0 allow, 2 block. An internal error never blocks: it is logged and the
# call is allowed. Without jq the hook allows everything and logs a warning.
#
# Test: bash .claude/hooks/test-guardrails.sh

set -euo pipefail
set -f # never glob: command words are split into tokens, not expanded
export LC_ALL=C

BLOCKED=0
LOG=/dev/null

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >>"$LOG" 2>/dev/null || true
}

# Any non-zero exit that isn't a deliberate block becomes "allow", so a parsing
# problem can't fail closed.
on_exit() {
  rc=$?
  if [ "$rc" -ne 0 ] && [ "$BLOCKED" -ne 1 ]; then
    log "WARN internal error (exit $rc); call allowed"
    exit 0
  fi
}
trap on_exit EXIT

ROOT=${CLAUDE_PROJECT_DIR:-}
if [ -z "$ROOT" ]; then
  ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
fi
STATE_DIR="$ROOT/.offshore"

# No run in progress: allow everything.
[ -f "$STATE_DIR/active" ] || exit 0

LOG="$STATE_DIR/guardrails.log"
AGENTS_LOG="$STATE_DIR/agents.log"

if ! command -v jq >/dev/null 2>&1; then
  log "WARN jq not found; guardrails inactive, call allowed"
  exit 0
fi

PAYLOAD=$(cat 2>/dev/null || true)
TOOL=$(printf '%s' "$PAYLOAD" | jq -r '.tool_name // empty' 2>/dev/null || true)
CWD=$(printf '%s' "$PAYLOAD" | jq -r '.cwd // empty' 2>/dev/null || true)
[ -n "$CWD" ] || CWD=$ROOT

FOOTER="(This guardrail is on because .offshore/active exists: an unattended /offshore run is in progress. Never delete that file or edit this hook to get past a block; the run removes the file itself when it ends. If no run is in progress, a person can delete it.)"

block() { # $1: short reason for the log, $2: what to do instead
  BLOCKED=1
  log "BLOCK tool=$TOOL $1"
  printf 'OFFSHORE GUARDRAIL: blocked %s.\n%s\n%s\n' "$1" "$2" "$FOOTER" >&2
  exit 2
}

MSG_PROTECTED="Offshore work is pushed only to feature/<plan>. develop, staging, and main change only through a PR that a person merges. Push your feature branch by name: git push --force-with-lease origin feature/<plan> (plain git push origin feature/<plan> if you didn't rewrite history)."
MSG_FORCE="A bare force push can overwrite work someone else pushed. Use --force-with-lease on your feature branch. If the lease is rejected: git fetch origin, look at what arrived (git log HEAD..origin/<branch>), rebase onto it, and push with --force-with-lease again."
MSG_HOOKS="Hooks must run on every commit and push. Fix what the hook reports and try again. If you can't fix it, record the failure (a blocked result, or an Action Item for the briefing) instead of bypassing the hook."
MSG_RESET="git reset --hard throws work away. To squash, use git reset --soft <sha> and commit. To drop a file's changes, git restore <path>. To set work aside, git stash."
MSG_AMEND="Make a new commit instead; the feature branch is squashed later. To record a squashed commit's SHA, write it to CHECKPOINT.json and let that ride in the next commit. Don't amend it in."
MSG_MERGE="The person merges. Leave the PR open and green, and say in the briefing that it's ready for review."
MSG_ASK="No one is there to answer. Decide using CLAUDE.md, the Agents.md guides, and the plan, and record the decision (orchestrator: a decision event in CHECKPOINT.json; sub-agent: the decisions list in your result). If the decision truly isn't yours to make, stop that unit as blocked with the question so the briefing asks it."

is_protected() {
  case ${1:-} in
    develop | staging | main) return 0 ;;
  esac
  return 1
}

current_branch() { # $1: directory
  git -C "$1" symbolic-ref --short -q HEAD 2>/dev/null || true
}

lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

# Drop heredoc bodies (commit messages written with <<EOF): they are data, not commands.
drop_heredocs() {
  local out="" delim="" line rest trimmed tab
  tab=$(printf '\t')
  while IFS= read -r line || [ -n "$line" ]; do
    if [ -n "$delim" ]; then
      trimmed=${line#"${line%%[!$tab]*}"} # <<- allows leading tabs
      if [ "$trimmed" = "$delim" ]; then delim=""; fi
      continue
    fi
    out="$out$line"$'\n'
    case $line in
      *'<<'*)
        rest=${line#*<<}
        rest=${rest#-}
        rest=${rest#"${rest%%[! ]*}"}
        rest=${rest#[\'\"\\]}
        delim=${rest%%[!A-Za-z0-9_]*}
        case $delim in
          [A-Za-z_]*) ;;
          *) delim="" ;;
        esac
        ;;
    esac
  done <<<"$1"
  printf '%s' "$out"
}

# Replace each quoted string. A quoted single word (no spaces or shell operators) is
# kept without its quotes, so "feature/$PLAN" is still a branch name. Anything longer
# becomes _Q_, so flags inside messages don't count. A double-quoted string holding a
# command substitution is processed recursively, so "$(git push ...)" is still checked.
neutralize_quotes() {
  local rest=$1 out="" buf part c closed
  while [ -n "$rest" ]; do
    # Copy everything up to the next quote or backslash in one step.
    part=${rest%%[\"\'\\]*}
    out="$out$part"
    rest=${rest#"$part"}
    [ -n "$rest" ] || break
    c=${rest%"${rest#?}"}
    rest=${rest#?}
    case $c in
      \\) # an escaped character outside quotes is literal
        out="$out$c${rest%"${rest#?}"}"
        rest=${rest#?}
        continue
        ;;
      \')
        closed=0
        case $rest in *\'*) closed=1 ;; esac
        buf=${rest%%\'*}
        rest=${rest#"$buf"}
        rest=${rest#\'}
        ;;
      \")
        closed=0
        buf=""
        while [ -n "$rest" ]; do
          part=${rest%%[\"\\]*}
          buf="$buf$part"
          rest=${rest#"$part"}
          [ -n "$rest" ] || break
          c=${rest%"${rest#?}"}
          rest=${rest#?}
          if [ "$c" = '"' ]; then
            closed=1
            break
          fi
          buf="$buf$c${rest%"${rest#?}"}" # backslash escape inside double quotes
          rest=${rest#?}
        done
        ;;
    esac
    if [ "$closed" -eq 0 ]; then
      out="$out _Q_" # unterminated quote: the shell would reject the command anyway
      break
    fi
    case $buf in
      *'$('* | *'`'*) out="$out$(neutralize_quotes "$buf")" ;;
      '') out="${out}_Q_" ;;
      *[[:space:]]* | *[\;\&\|\(\)\<\>]*) out="${out}_Q_" ;;
      *) out="$out$buf" ;;
    esac
  done
  printf '%s' "$out"
}

SEEN="" # git/gh commands seen, for the ALLOW log line

check_config_value() { # a -c key=value passed to git
  case $(lower "${1:-}") in
    core.hookspath | core.hookspath=*) block "core.hooksPath override" "$MSG_HOOKS" ;;
  esac
}

check_git_config() { # git config ... core.hooksPath <value>
  local a sets=0 reads=0
  for a in "$@"; do
    case $(lower "$a") in
      core.hookspath) sets=1 ;;
      --get | --get-all | --get-regexp | --list | -l | --unset | --unset-all | get | list | unset) reads=1 ;;
    esac
  done
  if [ "$sets" -eq 1 ] && [ "$reads" -eq 0 ]; then
    block "git config core.hooksPath" "$MSG_HOOKS"
  fi
}

check_commit() {
  local skip=0 flags ch
  while [ $# -gt 0 ]; do
    if [ "$skip" -eq 1 ]; then
      skip=0
      shift
      continue
    fi
    case $1 in
      --amend) block "git commit --amend" "$MSG_AMEND" ;;
      --no-verify) block "git commit --no-verify" "$MSG_HOOKS" ;;
      --) break ;;
      -m | -F | -C | -c | -t | --message | --file | --reuse-message | --reedit-message | \
        --template | --author | --date | --cleanup | --trailer | --fixup | --squash)
        skip=1
        ;;
      --*) ;;
      -?*)
        flags=${1#-}
        while [ -n "$flags" ]; do
          ch=${flags%"${flags#?}"}
          flags=${flags#?}
          case $ch in
            n) block "git commit -n (--no-verify)" "$MSG_HOOKS" ;;
            m | F | C | c | t)
              if [ -z "$flags" ]; then skip=1; fi
              flags=""
              ;;
            u | S) flags="" ;; # the rest of the cluster is this option's value
          esac
        done
        ;;
    esac
    shift
  done
}

check_push() { # $1: directory, then the push arguments
  local dir=$1 remote="" specs="" force="" all="" delete=0 skip=0 spec dst
  shift
  while [ $# -gt 0 ]; do
    if [ "$skip" -eq 1 ]; then
      skip=0
      shift
      continue
    fi
    case $1 in
      --force-with-lease | --force-with-lease=* | --force-if-includes) ;;
      --force | --force=*) force=$1 ;;
      --delete) delete=1 ;;
      --all | --mirror | --branches) all=$1 ;;
      --no-verify) block "git push --no-verify" "$MSG_HOOKS" ;;
      --repo | --push-option | --receive-pack | --exec) skip=1 ;;
      --*) ;;
      -?*)
        case $1 in *f*) force=$1 ;; esac
        case $1 in *d*) delete=1 ;; esac
        case $1 in *o) skip=1 ;; esac
        ;;
      *'>'* | *'<'*) ;; # redirection
      *)
        if [ -z "$remote" ]; then remote=$1; else specs="$specs $1"; fi
        ;;
    esac
    shift
  done
  SEEN="$SEEN git push $remote$specs;"

  if [ -n "$force" ]; then block "bare force push ($force)" "$MSG_FORCE"; fi
  if [ -n "$all" ]; then
    block "git push $all" "$all can update or delete develop, staging, or main. $MSG_PROTECTED"
  fi

  for spec in $specs; do
    case $spec in
      +*) block "force push with a + refspec ($spec)" "$MSG_FORCE" ;;
    esac
    case $spec in
      *:*) dst=${spec##*:} ;;
      *) dst=$spec ;;
    esac
    if [ "$dst" = HEAD ] || [ "$dst" = @ ]; then dst=$(current_branch "$dir"); fi
    dst=${dst#refs/heads/}
    if is_protected "$dst"; then
      case $spec in
        :*) block "deleting $dst" "Deleting develop, staging, or main is never allowed. $MSG_PROTECTED" ;;
      esac
      if [ "$delete" -eq 1 ]; then
        block "deleting $dst" "Deleting develop, staging, or main is never allowed. $MSG_PROTECTED"
      fi
      block "git push to $dst" "$MSG_PROTECTED"
    fi
  done

  if [ -z "$specs" ] && [ "$delete" -eq 0 ]; then
    dst=$(current_branch "$dir")
    if is_protected "$dst"; then
      block "git push while $dst is checked out" "This push would update $dst. Switch to your feature branch (git switch feature/<plan>) and push it by name. $MSG_PROTECTED"
    fi
  fi
}

check_git() { # $1: directory, then everything after "git"
  local dir=$1 sub
  shift
  while [ $# -gt 0 ]; do
    case $1 in
      -C)
        shift
        if [ $# -gt 0 ]; then
          case $1 in
            /*) dir=$1 ;;
            *) dir="$dir/$1" ;;
          esac
          shift
        fi
        ;;
      -c)
        shift
        if [ $# -gt 0 ]; then
          check_config_value "$1"
          shift
        fi
        ;;
      -c?*)
        check_config_value "${1#-c}"
        shift
        ;;
      --git-dir | --work-tree | --namespace | --config-env)
        shift
        [ $# -eq 0 ] || shift
        ;;
      -*) shift ;;
      *) break ;;
    esac
  done
  [ $# -gt 0 ] || return 0
  sub=$1
  shift
  case $sub in
    push) check_push "$dir" "$@" ;;
    commit)
      SEEN="$SEEN git commit;"
      check_commit "$@"
      ;;
    reset)
      SEEN="$SEEN git reset;"
      local a
      for a in "$@"; do
        if [ "$a" = --hard ]; then block "git reset --hard" "$MSG_RESET"; fi
      done
      ;;
    config) check_git_config "$@" ;;
    merge | pull | rebase | am)
      SEEN="$SEEN git $sub;"
      local a
      for a in "$@"; do
        if [ "$a" = --no-verify ]; then block "git $sub --no-verify" "$MSG_HOOKS"; fi
      done
      ;;
  esac
}

check_gh() { # everything after "gh"
  local words="" a
  for a in "$@"; do
    case $a in
      */pulls/*/merge | */pulls/*/merge/) block "merging a pull request (gh api)" "$MSG_MERGE" ;;
      -*) ;;
      *) words="$words $a" ;;
    esac
  done
  case "$words " in
    *" pr merge "*) block "gh pr merge" "$MSG_MERGE" ;;
  esac
  return 0
}

check_segment() { # one simple command
  set -- $1
  while [ $# -gt 0 ]; do
    case $1 in
      [A-Za-z_]*=*) shift ;; # environment assignment
      sudo | env | command | builtin | exec | nohup | time | nice | if | then | else | elif | \
        do | while | until | '!' | '{') shift ;;
      -*) shift ;; # a wrapper's flag
      *) break ;;
    esac
  done
  [ $# -gt 0 ] || return 0
  case $1 in
    git | */git)
      shift
      check_git "$CWD" "$@"
      ;;
    gh | */gh)
      shift
      SEEN="$SEEN gh;"
      check_gh "$@"
      ;;
  esac
  return 0
}

check_bash() {
  local cmd text seg
  cmd=$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
  [ -n "$cmd" ] || return 0
  text=$(drop_heredocs "$cmd")
  text=$(neutralize_quotes "$text")
  # Split into simple commands at ; & | ( ) ` and newlines.
  text=$(printf '%s\n' "$text" | tr ';&|()`' '\n\n\n\n\n\n')
  while IFS= read -r seg || [ -n "$seg" ]; do
    check_segment "$seg"
  done <<<"$text"
}

case $TOOL in
  AskUserQuestion)
    block "AskUserQuestion" "$MSG_ASK"
    ;;
  *merge_pull_request* | *enable_pr_auto_merge*)
    block "merging a pull request ($TOOL)" "$MSG_MERGE"
    ;;
  Agent | Task)
    agent=$(printf '%s' "$PAYLOAD" | jq -r '[(.tool_input.subagent_type // "general-purpose"), ((.tool_input.description // "") | gsub("[\\t\\r\\n]"; " "))] | join(" | ")' 2>/dev/null || true)
    printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$agent" >>"$AGENTS_LOG" 2>/dev/null || true
    log "ALLOW tool=$TOOL spawn: $agent"
    ;;
  Bash)
    check_bash
    log "ALLOW tool=Bash${SEEN}"
    ;;
  '')
    log "WARN no tool_name in payload; call allowed"
    ;;
  *)
    log "ALLOW tool=$TOOL"
    ;;
esac
exit 0
