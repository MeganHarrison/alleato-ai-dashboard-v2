import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
      lines: 90,
      functions: 90,
      branches: 80,
      statements: 90
    }
  }
});
