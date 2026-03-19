import { defineConfig, devices } from "@playwright/test";

/**
 * Paygees Production Test Suite
 * Target: https://paygees-web.vercel.app
 * Product Bible: v4.5 (March 16, 2026)
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["allure-playwright", { outputFolder: "allure-results" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: "https://paygees-web.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile browsers
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
    // Tablet
    {
      name: "tablet",
      use: { ...devices["iPad Pro 11"] },
    },
  ],

  outputDir: "test-results/",

  // Run smoke tests first, then the rest
  // Uncomment if you want strict ordering:
  // projects ordering handled by test tags
});
