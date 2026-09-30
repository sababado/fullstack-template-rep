/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Local dev calls /api/... and Vite forwards to the backend, so there's no CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        // Vendor code changes rarely: separate chunks stay cached across app deploys.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            {
              name: 'auth',
              test: /node_modules[\\/](oidc-client-ts|react-oidc-context|jwt-decode)[\\/]/,
            },
            {
              name: 'i18n',
              test: /node_modules[\\/](i18next|react-i18next|i18next-icu|intl-messageformat|@formatjs)/,
            },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/core/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/core/test/**',
        'src/core/api/schema.d.ts',
        'src/main.tsx',
      ],
      // Floors, not targets: raise them as coverage grows, never lower them.
      thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 },
    },
  },
});
