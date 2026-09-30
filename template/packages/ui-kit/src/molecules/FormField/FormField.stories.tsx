import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../../atoms/Input/Input';
import { Textarea } from '../../atoms/Textarea/Textarea';
import { FormField } from './FormField';

const meta = {
  title: 'Molecules/FormField',
  component: FormField,
  args: {
    label: 'Title',
    children: (control) => <Input {...control} placeholder="Weekly plan" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = { args: { hint: 'Up to 200 characters.', required: true } };

export const WithError: Story = { args: { error: 'Enter a title.', required: true } };

export const Multiline: Story = {
  args: {
    label: 'Details',
    children: (control) => <Textarea {...control} />,
  },
};
