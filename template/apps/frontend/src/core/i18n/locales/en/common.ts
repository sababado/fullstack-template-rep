// ICU message syntax: {name}, {count, plural, one {# item} other {# items}}.
export default {
  skipToContent: 'Skip to content',
  loading: 'Loading…',
  nav: {
    notes: 'Notes',
  },
  theme: {
    label: 'Color theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  auth: {
    signOut: 'Sign out',
    signingIn: 'Signing you in…',
    failed: "Sign-in didn't work",
    retry: 'Try again',
  },
  notFound: {
    title: 'Page not found',
    body: "The page you're looking for doesn't exist.",
    home: 'Go to your notes',
  },
  routeError: {
    title: 'Something went wrong',
    body: 'Reload the page to try again.',
    reload: 'Reload',
  },
} as const;
