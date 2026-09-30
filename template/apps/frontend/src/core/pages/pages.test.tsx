import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { json, mockApi } from '../test/mockApi';
import { renderApp } from '../test/renderApp';
import { RouteErrorPage } from './RouteErrorPage';

describe('RouteErrorPage', () => {
  it('offers a reload', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(<RouteErrorPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('AuthCallbackPage', () => {
  it('shows progress while sign-in completes', async () => {
    renderApp('/auth/callback');
    expect(await screen.findByRole('status', { name: 'Signing you in…' })).toBeInTheDocument();
  });
});

describe('App', () => {
  it('boots to the notes page', async () => {
    mockApi({ 'GET /notes': () => json(200, { items: [] }) });
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Notes', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
  });
});
