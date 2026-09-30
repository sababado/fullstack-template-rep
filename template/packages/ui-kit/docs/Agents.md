# UI kit guide (`packages/ui-kit`)

The design system: tokens, the Tailwind theme, and every component the apps render.
Built on Tailwind CSS 4, Radix primitives, and `class-variance-authority`, in the style
of shadcn/ui (the components live here and are ours to change).

## Layout

```
src/
  styles.css      Tokens (CSS variables) for light and dark, and the Tailwind theme
  lib/cn.ts       Class-name merge helper
  atoms/          Primitives: Button, Input, Textarea, Label, Spinner
  molecules/      Combinations: FormField, Alert, Card, EmptyState, ThemeToggle
  organisms/      Page sections: AppShell
  theme/          ThemeProvider and useTheme (light, dark, system)
  foundations/    Stories that document the tokens
  index.ts        Public exports
```

Each component folder holds `Component.tsx`, `Component.stories.tsx`, and
`Component.test.tsx`.

## Rules

- **Tokens, not colors.** Use `bg-background`, `bg-surface`, `text-foreground`,
  `text-muted-foreground`, `bg-primary text-primary-foreground`, `bg-destructive`,
  `border-border`, `ring-ring`. They switch with the theme. To add a color, add a
  variable to both `:root` and `.dark` in `styles.css`, map it in `@theme inline`, check
  contrast in both themes (the `Foundations/Colors` story tests it), and document it there.
- **No hardcoded copy.** Every user-visible string, including accessible names, arrives
  as a prop, so apps translate it. Components don't import i18n.
- **Accessible by default.** Use native elements (`button`, `a`, `label`). Keep visible
  focus styles. Icon-only controls require a label prop. Decorative icons get
  `aria-hidden`.
- **Variants with `cva`.** Keep variant maps in their own module (for example
  `buttonVariants.ts`) so component files export only components.
- **Pass through props.** Accept `className` and spread native props so apps can extend
  a component without forking it.

## Adding a component

1. Pick the level: atom (one element), molecule (a few atoms), organism (a page section).
2. Write the component, a story for each meaningful state (and a dark-mode story if its
   colors change), and a unit test for its behavior.
3. Export it from `src/index.ts`.
4. Run the story tests: every story renders in Chromium and axe fails the run on any
   accessibility violation.

## Verifiability checklist

```bash
npm run typecheck -w @app/ui-kit
npm test -w @app/ui-kit                 # unit tests + coverage floors (vite.config.ts)
npm run test:stories -w @app/ui-kit     # stories in Chromium with axe
npm run build-storybook -w @app/ui-kit
```

Story tests need Chromium: run `npx playwright install chromium` once. To use a browser
you already have, set `CHROMIUM_EXECUTABLE_PATH`.
