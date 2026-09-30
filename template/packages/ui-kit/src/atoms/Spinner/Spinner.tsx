import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export interface SpinnerProps extends Omit<ComponentProps<'svg'>, 'ref'> {
  /** Announced to screen readers. Omit when the spinner sits inside a labelled control. */
  label?: string;
}

export function Spinner({ label, className, ...props }: SpinnerProps) {
  return (
    <LoaderCircle
      className={cn('size-4 animate-spin', className)}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
    />
  );
}
