import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'PORT=4173 node scripts/server.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 375, height: 812 } } }
  ]
});
