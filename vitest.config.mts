import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['dotenv/config', 'test/setup-next-navigation.ts'],
    retry: 3,
  },
  resolve: {
    alias: {
      'next/navigation': path.resolve(rootDir, 'node_modules/next/navigation.js'),
    },
    tsconfigPaths: true,
  },
});
