import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['dotenv/config', 'test/setup-next-navigation.ts'],
    retry: 3,
  },
  resolve: {
    tsconfigPaths: true,
  },
});
