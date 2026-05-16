import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['dotenv/config'], //this line,
    retry: 3,
  },
  resolve: {
    tsconfigPaths: true,
  },
});
