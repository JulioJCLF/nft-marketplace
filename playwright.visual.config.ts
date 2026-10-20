import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/snapshots',
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-visual-report', open: 'never' }],
  ],
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'Desktop Visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
      testMatch: '**/visual-regression.spec.ts',
    },
    {
      name: 'Mobile Visual',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
      testMatch: '**/responsive-visual.spec.ts',
    },
    {
      name: 'Tablet 768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
      testMatch: '**/responsive-visual.spec.ts',
    },
    {
      name: 'Desktop 1080p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: '**/responsive-visual.spec.ts',
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30000,
  },
})
