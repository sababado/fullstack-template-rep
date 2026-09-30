"""Copy files changed in a rendered sample project back into template/.

Use it after a formatter, `uv lock`, or `npm install` changed files in the sample.
Files rendered from a .jinja source are skipped (edit the .jinja file instead), as
are caches and build output. package-lock.json is templated, so it's reported, not
copied: regenerate template/package-lock.json.jinja with --lockfile.

Usage:
  python scripts/sync_back.py <sample-dir> [<relative path> ...] [--dry-run] [--lockfile]
"""

import argparse
import filecmp
import json
import shutil
from pathlib import Path

TEMPLATE = Path(__file__).resolve().parent.parent / "template"
SKIP_DIRS = {
    ".git", ".venv", "node_modules", "__pycache__", ".pytest_cache", ".ruff_cache", ".mypy_cache",
    ".import_linter_cache", "htmlcov", "dist", "storybook-static", "coverage", ".aws-sam",
    "test-results", ".vitest-reports",
}
SKIP_FILES = {".coverage", "coverage.xml", ".env", ".copier-answers.yml", "package-lock.json"}


def rendered_from_templated_name(dst: Path) -> bool:
    """True when a sibling with a Jinja file name (for example a conditional file) renders to dst."""
    if not dst.parent.exists():
        return False
    return any(
        ("{%" in sibling.name or "{{" in sibling.name) and dst.name in sibling.name
        for sibling in dst.parent.iterdir()
    )


def sync(sample: Path, rel: str, dry_run: bool) -> None:
    for src in sorted((sample / rel).rglob("*") if (sample / rel).is_dir() else [sample / rel]):
        parts = src.relative_to(sample).parts
        if src.is_dir() or any(p in SKIP_DIRS for p in parts) or src.name in SKIP_FILES:
            continue
        if src.suffix == ".tsbuildinfo":
            continue
        dst = TEMPLATE / src.relative_to(sample)
        if dst.with_name(dst.name + ".jinja").exists() or rendered_from_templated_name(dst):
            continue
        if dst.exists() and filecmp.cmp(src, dst, shallow=False):
            continue
        print(("would copy " if dry_run else "copied ") + str(src.relative_to(sample)) + ("" if dst.exists() else " (new)"))
        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def sync_lockfile(sample: Path) -> None:
    lock = (sample / "package-lock.json").read_text()
    name = json.loads(lock)["name"]
    needle = f'"name": "{name}"'
    if lock.count(needle) != 2:
        raise SystemExit(f"Expected the root name twice in package-lock.json, found {lock.count(needle)}.")
    (TEMPLATE / "package-lock.json.jinja").write_text(lock.replace(needle, '"name": "{{ project_slug }}"'))
    print("updated template/package-lock.json.jinja")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("sample", type=Path)
    parser.add_argument("paths", nargs="*", default=["."])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--lockfile", action="store_true", help="also regenerate package-lock.json.jinja")
    args = parser.parse_args()
    for rel in args.paths:
        sync(args.sample.resolve(), rel, args.dry_run)
    if args.lockfile and not args.dry_run:
        sync_lockfile(args.sample.resolve())


if __name__ == "__main__":
    main()
