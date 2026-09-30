import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    // Native pointer lock needs a focused desktop window on macOS Chromium.
    headless: false,
    baseURL: "http://127.0.0.1:3000",
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
  },
  webServer: { command: "npm run dev -- --hostname 127.0.0.1", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
