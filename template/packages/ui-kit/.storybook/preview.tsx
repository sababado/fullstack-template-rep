import type { Decorator, Preview } from '@storybook/react-vite';
import './preview.css';

// Render every story in light or dark mode from the toolbar.
const withTheme: Decorator = (Story, context) => {
  const dark = context.globals['theme'] === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  return (
    <div className="min-h-24 p-6 bg-background text-foreground">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i } },
    // Story tests fail on accessibility violations, not just log them.
    a11y: { test: 'error' },
  },
};

export default preview;
