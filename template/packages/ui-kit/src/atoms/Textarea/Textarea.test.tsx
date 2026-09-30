import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from '../Label/Label';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a labelled multi-line field', () => {
    render(
      <>
        <Label htmlFor="details">Details</Label>
        <Textarea id="details" defaultValue="Line one" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Details' })).toHaveValue('Line one');
  });
});
