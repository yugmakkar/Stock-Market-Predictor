import { defineConfig, devices } from "@playwright/test"

// E2E runs against the app in DEMO data mode so no network egress is required.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    // Use the Chromium preinstalled in this environment.
    launchOptions: { executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://127.0.0.1:3100",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { DATA_MODE: "demo", NEXT_PUBLIC_DATA_MODE: "demo" },
  },
})
