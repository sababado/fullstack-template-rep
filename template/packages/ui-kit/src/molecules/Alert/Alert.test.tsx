import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it('interrupts screen readers only for destructive alerts', () => {
    const { rerender } = render(<Alert variant="destructive" title="Failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');

    rerender(
      <Alert variant="success" title="Saved">
        Done.
      </Alert>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('SavedDone.');
  });
});
