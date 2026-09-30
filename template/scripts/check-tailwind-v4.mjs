// Fails when code slips back to Tailwind v3 conventions that v4 ignores.
// Tailwind silently drops class names it doesn't know, so these would ship as
// missing styles instead of errors. Runs as part of `npm run lint`.
// See packages/ui-kit/docs/Agents.md ("Tailwind CSS 4").
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const IGNORED = /(^|\/)(node_modules|dist|coverage|storybook-static|\.git|\.venv)(\/|$)/;

function listFiles() {
  try {
    return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    // Not a git repository yet (for example right after `copier copy`).
    return readdirSync('.', { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => `${entry.parentPath}/${entry.name}`.replace(/^\.\//, ''))
      .filter((file) => !IGNORED.test(file));
  }
}

const files = listFiles();

const problems = [];

for (const file of files) {
  if (/(^|\/)tailwind\.config\.[cm]?[jt]s$/.test(file)) {
    problems.push(
      `${file}: Tailwind 4 is configured in packages/ui-kit/src/styles.css; remove this file.`,
    );
  }
}

const removedUtilities = [
  [
    /\b(?:bg|text|border|divide|placeholder|ring)-opacity-\d+\b/,
    'use a color with an opacity modifier, e.g. bg-black/50',
  ],
  [/\bflex-(?:shrink|grow)(?:-\d+)?\b/, 'use shrink-*/grow-*'],
  [/\boverflow-ellipsis\b/, 'use text-ellipsis'],
  [/\bdecoration-(?:slice|clone)\b/, 'use box-decoration-slice/box-decoration-clone'],
];
const sources = files.filter((file) => /^(apps|packages)\/[^/]+\/src\/.*\.(tsx?|mdx)$/.test(file));

for (const file of sources) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      for (const [pattern, fix] of removedUtilities) {
        const match = line.match(pattern);
        if (match)
          problems.push(`${file}:${index + 1}: "${match[0]}" is a Tailwind v3 utility; ${fix}.`);
      }
    });
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} Tailwind v3 leftover(s). See packages/ui-kit/docs/Agents.md.`,
  );
  process.exit(1);
}
console.log('Tailwind 4 conventions: OK');
