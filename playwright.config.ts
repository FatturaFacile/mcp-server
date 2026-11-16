import { defineConfig } from '@playwright/test';

// Config is read when src/config/environment.ts is first imported, so the
// transport settings must be in the environment before the test files load.
process.env.MCP_TRANSPORT = 'streamable-http';
process.env.PORT = '3001';
process.env.HOST = '127.0.0.1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
});
