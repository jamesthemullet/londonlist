import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_EXEC_PATH;

const MOCK_STRAPI_PORT = 4001;
const MOCK_STRAPI_URL = `http://127.0.0.1:${MOCK_STRAPI_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: [
    {
      command: 'node --experimental-strip-types e2e/mock-api/server.ts',
      url: MOCK_STRAPI_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      env: { MOCK_STRAPI_PORT: String(MOCK_STRAPI_PORT) },
    },
    {
      command: 'yarn dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { STRAPI_URL: MOCK_STRAPI_URL },
    },
  ],
});
