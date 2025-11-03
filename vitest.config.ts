import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
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
    },
  },
});
