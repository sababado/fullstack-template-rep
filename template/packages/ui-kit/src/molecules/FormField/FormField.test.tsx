import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../../atoms/Input/Input';
import { FormField } from './FormField';

describe('FormField', () => {
  it('labels the control and links hint and error text', () => {
    render(
      <FormField label="Title" hint="Keep it short." error="Enter a title." required>
        {(control) => <Input {...control} />}
      </FormField>,
    );

    const input = screen.getByRole('textbox', { name: /Title/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Keep it short. Enter a title.');
  });

  it('leaves a valid control unmarked', () => {
    render(<FormField label="Title">{(control) => <Input {...control} />}</FormField>);

    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
