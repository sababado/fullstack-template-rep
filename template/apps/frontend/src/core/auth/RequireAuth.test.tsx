import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { json, mockApi } from '../test/mockApi';
import { renderApp } from '../test/renderApp';

describe('RequireAuth', () => {
  // /notes is a lazy route: the router renders once its module loads, hence findBy.
  it('starts sign-in for anonymous visitors', async () => {
    const signIn = vi.fn(() => Promise.resolve());
    renderApp('/notes', { auth: { status: 'anonymous', user: null, signIn } });

    expect(await screen.findByRole('status', { name: 'Signing you in…' })).toBeInTheDocument();
    expect(signIn).toHaveBeenCalled();
  });

  it('shows sign-in failures with a retry', async () => {
    const signIn = vi.fn(() => Promise.resolve());
    renderApp('/notes', {
      auth: { status: 'error', user: null, error: new Error('invalid_grant'), signIn },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('invalid_grant');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(signIn).toHaveBeenCalledOnce();
  });

  it('renders the app and signs out', async () => {
    mockApi({ 'GET /notes': () => json(200, { items: [] }) });
    const signOut = vi.fn(() => Promise.resolve());
    renderApp('/', { auth: { signOut } });

    expect(await screen.findByRole('heading', { name: 'Notes', level: 1 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalledOnce();
  });
});

describe('routing', () => {
  it('shows a not-found page for unknown paths', async () => {
    renderApp('/does-not-exist');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to your notes' })).toHaveAttribute(
      'href',
      '/notes',
    );
  });
});
