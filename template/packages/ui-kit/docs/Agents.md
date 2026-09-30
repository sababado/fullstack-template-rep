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

## Tailwind CSS 4

The project starts on Tailwind 4, which is configured in CSS. There is no
`tailwind.config.js` and no PostCSS config; don't add one.

**How it's wired**

- `packages/ui-kit/src/styles.css` is the whole design system: the token variables
  (`:root` and `.dark`), `@theme inline` (which turns them into utilities such as
  `bg-primary`), base styles, and `@custom-variant dark` (dark mode follows the `dark`
  class that `ThemeProvider` sets on `<html>`).
- `@source './'` in that file makes Tailwind scan the kit's components wherever the file
  is imported, so apps need no extra configuration.
- Apps load it from their own CSS: `@import 'tailwindcss';` then
  `@import '@app/ui-kit/styles.css';` (see `apps/frontend/src/index.css`). The Vite
  plugin `@tailwindcss/vite` does the rest.
- Prettier sorts class names with `prettier-plugin-tailwindcss`, which reads the theme
  through `apps/frontend/src/index.css`, which imports Tailwind and this file (`tailwindStylesheet` in `.prettierrc.json`).

**Write v4, not v3.** Most examples online are v3. Tailwind silently ignores classes
that don't exist, so a v3 habit produces no CSS rather than an error.

| Instead of (v3) | Write (v4) | Why |
| --- | --- | --- |
| `tailwind.config.js` `theme.extend` | a variable in `:root`/`.dark` plus a line in `@theme inline` in `styles.css` | Configuration lives in CSS |
| `shadow-sm`, `shadow` | `shadow-xs`, `shadow-sm` | The scale shifted one step |
| `rounded-sm`, `rounded` | `rounded-xs`, `rounded-sm` | The scale shifted one step |
| `blur-sm`, `blur` | `blur-xs`, `blur-sm` | The scale shifted one step |
| `outline-none` (to hide focus rings) | `outline-hidden` | v4's `outline-none` also removes the outline in forced-colors mode |
| `ring` (3px) | `ring-3` | v4's `ring` is 1px |
| `bg-opacity-50`, `text-opacity-50` | `bg-black/50`, `text-foreground/50` | Opacity utilities were removed |
| `flex-shrink-0`, `flex-grow` | `shrink-0`, `grow` | Old names were removed |
| `overflow-ellipsis` | `text-ellipsis` | Old name was removed |
| `bg-[--brand]` | `bg-(--brand)` | New syntax for CSS-variable values |
| `!font-bold` | `font-bold!` | `!important` modifier moved to the end |

Other v4 behavior to know: borders default to `currentColor` (the base layer sets
`border-border`), placeholders use the text color at half opacity, and `hover:` only
applies on devices that can hover.

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
