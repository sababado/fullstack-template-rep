"""Check a project rendered from the template.

Usage: python scripts/check_render.py <rendered-dir>

Fails when the rendered project contains leftover Jinja, a .jinja file, or the wrong
set of optional files for the answers in its .copier-answers.yml.
"""

import re
import sys
from pathlib import Path

SKIP_DIRS = {
    ".git", "node_modules", ".venv", "dist", "coverage", "storybook-static", ".aws-sam",
    ".mypy_cache", ".ruff_cache", ".pytest_cache", "__pycache__", ".import_linter_cache",
}
BINARY_SUFFIXES = {".png", ".jpg", ".ico", ".woff2", ".lock"}
# Jinja blocks never appear in rendered output. `{{ ... }}` is also valid JSX and
# GitHub Actions syntax, so only flag it around the template's own variables.
JINJA = re.compile(
    r"\{%|\{\{\s*(project_|tracker|github_repository|code_owner|aws_region|include_|_copier)"
)


def answers(root: Path) -> dict[str, str]:
    result = {}
    for line in (root / ".copier-answers.yml").read_text().splitlines():
        if ":" in line and not line.startswith("#"):
            key, _, value = line.partition(":")
            result[key.strip()] = value.strip().strip("'\"")
    return result


def main() -> int:
    root = Path(sys.argv[1])
    problems: list[str] = []

    for path in root.rglob("*"):
        if path.is_dir() or any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        rel = path.relative_to(root)
        if path.suffix == ".jinja":
            problems.append(f"{rel}: .jinja file left in the output")
        if path.suffix in BINARY_SUFFIXES or path.name == "package-lock.json":
            continue
        try:
            text = path.read_text()
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(text.splitlines(), 1):
            if JINJA.search(line):
                problems.append(f"{rel}:{number}: leftover template syntax: {line.strip()[:100]}")

    config = answers(root)
    expectations = {
        ".mcp.json": config.get("tracker") == "linear",
        ".github/workflows/claude-review.yml": config.get("include_claude_review") == "true",
    }
    for rel, should_exist in expectations.items():
        if (root / rel).exists() != should_exist:
            problems.append(f"{rel}: expected {'present' if should_exist else 'absent'}")

    for problem in problems:
        print(problem)
    print(f"{'FAIL' if problems else 'OK'}: {root} ({len(problems)} problems)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
