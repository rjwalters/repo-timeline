import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'demo-dist/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/demo/**',
        'worker/**'
      ],
      // Updated thresholds based on current coverage
      // Previous: statements: 3, branches: 0, functions: 3, lines: 3
      // Current coverage: statements: 83.68%, branches: 80.97%, functions: 83.67%, lines: 83.46%
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
  },
});
