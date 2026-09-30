import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

const alertVariants = cva(
  'gap-3 p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 flex rounded-lg border',
  {
    variants: {
      variant: {
        info: 'border-border bg-surface text-surface-foreground',
        success: 'border-success/40 bg-success/10 text-foreground [&>svg]:text-success',
        destructive:
          'border-destructive/40 bg-destructive/10 text-foreground [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

const icons = { info: Info, success: CircleCheck, destructive: CircleAlert } as const;

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title: string;
  children?: ReactNode;
  className?: string;
}

/** Inline message. Destructive alerts interrupt screen readers (role="alert"). */
export function Alert({ variant, title, children, className }: AlertProps) {
  const Icon = icons[variant ?? 'info'];
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
    >
      <Icon aria-hidden />
      <div className="gap-1 flex flex-col">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  );
}
