import type { Meta, StoryObj } from '@storybook/react-vite';

const pairs = [
  ['bg-background', 'text-foreground', 'Page'],
  ['bg-surface', 'text-surface-foreground', 'Surface (cards, inputs)'],
  ['bg-muted', 'text-muted-foreground', 'Muted'],
  ['bg-primary', 'text-primary-foreground', 'Primary'],
  ['bg-secondary', 'text-secondary-foreground', 'Secondary'],
  ['bg-destructive', 'text-destructive-foreground', 'Destructive'],
  ['bg-success', 'text-success-foreground', 'Success'],
] as const;

function Swatches() {
  return (
    <ul className="gap-3 sm:grid-cols-2 grid">
      {pairs.map(([bg, text, name]) => (
        <li key={name} className={`${bg} ${text} p-4 rounded-lg border`}>
          <p className="font-medium">{name}</p>
          <p className="text-sm">
            <code>{bg}</code> + <code>{text}</code>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Every semantic color pair. The story test's axe check verifies their contrast. */
const meta = {
  title: 'Foundations/Colors',
  component: Swatches,
} satisfies Meta<typeof Swatches>;

export default meta;

export const Light: StoryObj<typeof meta> = {};
export const Dark: StoryObj<typeof meta> = { globals: { theme: 'dark' } };
