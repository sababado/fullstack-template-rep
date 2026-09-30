import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta = {
  title: 'Molecules/Alert',
  component: Alert,
  args: { title: 'Changes saved', children: 'Your note is up to date.' },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { title: 'Heads up', children: 'Notes are private to you.' } };
export const Success: Story = { args: { variant: 'success' } };
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    title: "Couldn't save",
    children: 'Check your connection and try again.',
  },
};
export const DestructiveDark: Story = { ...Destructive, globals: { theme: 'dark' } };
