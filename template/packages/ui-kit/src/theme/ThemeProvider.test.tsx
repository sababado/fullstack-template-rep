import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '../molecules/ThemeToggle/ThemeToggle';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

const labels = { light: 'Light', dark: 'Dark', system: 'System' };

describe('ThemeProvider', () => {
  it('follows the system theme by default', () => {
    render(
      <ThemeProvider>
        <ThemeToggle label="Theme" optionLabels={labels} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('applies and remembers an explicit choice', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle label="Theme" optionLabels={labels} />
      </ThemeProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('restores a stored choice', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('requires a provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });
});
