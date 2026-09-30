/// <reference types="vitest/config" />
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// Storybook reads this file for its dev server, and Vitest for both projects:
// - unit:      component tests in jsdom (*.test.tsx)
// - storybook: every story rendered in Chromium, with axe accessibility
//              checks that fail the run (see .storybook/preview.tsx)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/index.ts', 'src/test/**'],
      // Floors, not targets: raise them as coverage grows, never lower them.
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: `${dirname}/.storybook` })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              // Optional: use a preinstalled Chromium instead of `npx playwright install`.
              launchOptions: process.env.CHROMIUM_EXECUTABLE_PATH
                ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
                : {},
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
