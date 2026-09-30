import { AppShell, Button, ThemeToggle, cn } from '@app/ui-kit';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/authContext';
import { APP_NAME } from '../config/app';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'px-2 py-1 rounded-md text-muted-foreground hover:text-foreground',
    isActive && 'bg-muted text-foreground',
  );

export function AppLayout() {
  const { t } = useTranslation();
  const auth = useAuth();

  return (
    <AppShell
      brand={APP_NAME}
      skipLinkLabel={t('skipToContent')}
      nav={
        <NavLink to="/notes" className={navLinkClass}>
          {t('nav.notes')}
        </NavLink>
      }
      actions={
        <>
          <ThemeToggle
            label={t('theme.label')}
            optionLabels={{
              light: t('theme.light'),
              dark: t('theme.dark'),
              system: t('theme.system'),
            }}
          />
          {auth.user ? (
            <Button variant="ghost" size="sm" onClick={() => void auth.signOut()}>
              <LogOut aria-hidden />
              {t('auth.signOut')}
            </Button>
          ) : null}
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
