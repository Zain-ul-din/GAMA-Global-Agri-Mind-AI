import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start --port 3100",
    url: "http://127.0.0.1:3100/design",
    reuseExistingServer: false,
    env: {
      DB_FILE_NAME: process.env.DB_FILE_NAME ?? "file:/tmp/gama-e2e.db",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
