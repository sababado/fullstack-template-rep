import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button/Button';
import { AppShell } from './AppShell';

const meta = {
  title: 'Organisms/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    brand: 'Acme',
    skipLinkLabel: 'Skip to content',
    nav: (
      <a href="#notes" className="font-medium">
        Notes
      </a>
    ),
    actions: (
      <Button size="sm" variant="ghost">
        Sign out
      </Button>
    ),
    children: <h1 className="text-2xl font-semibold">Notes</h1>,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
