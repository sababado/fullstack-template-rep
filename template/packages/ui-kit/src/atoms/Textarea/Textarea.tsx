import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';
import { fieldClasses } from '../../lib/fieldClasses';

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(fieldClasses, 'py-2', className)} {...props} />;
}
