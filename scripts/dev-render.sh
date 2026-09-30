#!/usr/bin/env bash
# Render the working copy of the template into a sample project for testing.
# Re-running updates the files in place and keeps node_modules and .venv, so
# `npm ci` / `uv sync` only need to run once.
#
# Usage: scripts/dev-render.sh [dest] [extra copier -d flags...]
#   scripts/dev-render.sh ../sample
#   scripts/dev-render.sh ../sample-linear -d tracker=linear -d tracker_key=ACME
set -euo pipefail

dest=${1:-../fullstack-sample}
shift || true
repo_root=$(cd "$(dirname "$0")/.." && pwd)

uvx copier==9.18.2 copy --trust --defaults --overwrite --vcs-ref HEAD \
  -d "project_name=Acme Portal" -d github_repository=acme/acme-portal "$@" \
  "$repo_root" "$dest"

echo
echo "Rendered into $dest. First time only: (cd $dest && npm ci && cd apps/backend && uv sync)"
echo "Files removed from the template are not deleted from $dest; delete them by hand."
