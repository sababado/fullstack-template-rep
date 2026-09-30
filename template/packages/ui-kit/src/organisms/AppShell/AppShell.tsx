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
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {skipLinkLabel}
      </a>
      <header className="border-b bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
          <div className="font-semibold">{brand}</div>
          {nav ? (
            <nav className="flex flex-1 items-center gap-4 text-sm">{nav}</nav>
          ) : (
            <div className="flex-1" />
          )}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus:outline-hidden"
      >
        {children}
      </main>
    </div>
  );
}
