import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('offers a skip link to the main landmark', () => {
    render(
      <AppShell brand="Acme" skipLinkLabel="Skip to content" nav={<a href="/a">A</a>}>
        Body
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveTextContent('Body');
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('is announced only when labelled', () => {
    const { rerender } = render(<Spinner label="Loading notes" />);
    expect(screen.getByRole('status', { name: 'Loading notes' })).toBeInTheDocument();

    rerender(<Spinner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
