import type { Meta, StoryObj } from '@storybook/react-vite';
import { StickyNote } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  args: { title: 'No notes yet', description: 'Notes you create appear here.' },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: { icon: StickyNote, action: <Button size="sm">Create a note</Button> },
};
