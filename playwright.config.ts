import { defineConfig } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:4173";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: externalBaseURL ?? localBaseURL,
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: "pnpm --filter @victoroff/site dev --host 127.0.0.1 --port 4173 --strictPort",
        url: localBaseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
