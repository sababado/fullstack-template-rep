import { Monitor, Moon, Sun } from 'lucide-react';
import type { Theme } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
import { cn } from '../../lib/cn';

export interface ThemeToggleProps {
  /** Accessible name for the group, for example "Color theme". */
  label: string;
  /** Accessible names for each option. */
  optionLabels: Record<Theme, string>;
  className?: string;
}

const options = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
] as const;

export function ThemeToggle({ label, optionLabels, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('p-0.5 inline-flex rounded-md border bg-surface', className)}
    >
      {options.map(({ value, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={optionLabels[value]}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className="size-8 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        >
          <Icon aria-hidden className="size-4" />
        </button>
      ))}
    </div>
  );
}
