import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Molecules/ThemeToggle',
  component: ThemeToggle,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  args: { label: 'Color theme', optionLabels: { light: 'Light', dark: 'Dark', system: 'System' } },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const dark = within(canvasElement).getByRole('button', { name: 'Dark' });
    await userEvent.click(dark);
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'System' }));
  },
};
