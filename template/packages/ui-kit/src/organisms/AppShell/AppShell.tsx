import type { ReactNode } from 'react';

export interface AppShellProps {
  /** Product name or logo, shown at the start of the header. */
  brand: ReactNode;
  /** Primary navigation links. */
  nav?: ReactNode;
  /** Header actions such as the theme toggle and account menu. */
  actions?: ReactNode;
  /** Text of the "skip to content" link for keyboard users. */
  skipLinkLabel: string;
  children: ReactNode;
}

export function AppShell({ brand, nav, actions, skipLinkLabel, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="px-3 py-2 focus:top-3 focus:left-3 sr-only z-50 rounded-md bg-primary text-primary-foreground focus:not-sr-only focus:fixed"
      >
        {skipLinkLabel}
      </a>
      <header className="border-b bg-surface">
        <div className="h-14 max-w-5xl gap-6 px-4 mx-auto flex w-full items-center">
          <div className="font-semibold">{brand}</div>
          {nav ? (
            <nav className="gap-4 text-sm flex flex-1 items-center">{nav}</nav>
          ) : (
            <div className="flex-1" />
          )}
          {actions ? <div className="gap-2 flex items-center">{actions}</div> : null}
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="max-w-5xl px-4 py-8 mx-auto w-full flex-1 focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}
