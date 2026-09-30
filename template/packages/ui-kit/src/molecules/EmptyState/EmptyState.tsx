import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Usually a Button that creates the first item. */
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="gap-3 px-6 py-12 flex flex-col items-center rounded-xl border border-dashed text-center">
      <Icon aria-hidden className="size-8 text-muted-foreground" />
      <div className="gap-1 flex flex-col">
        <p className="font-medium">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
