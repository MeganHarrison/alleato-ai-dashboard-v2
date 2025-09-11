// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",

  /* Run tests in files in parallel */
  fullyParallel: false, // Changed to false to prevent multiple browser instances

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Limit workers to prevent multiple browser instances */
  workers: 1, // Limited to 1 worker to prevent multiple browser tabs

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // CHANGED: keep html locally; use JUnit on CI so GH Actions can consume it
  reporter: process.env.CI
    ? [["junit", { outputFile: "playwright-junit.xml" }]]
    : "html",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // CHANGED: allow override via BASE_URL in CI/preview; fallback to localhost
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Run in headless mode to avoid browser popup */
    headless: true,

    /* Viewport size */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Reduce timeout for faster failures */
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: process.env.BASE_URL || 'http://localhost:3000', // (will match the use.baseURL)
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
