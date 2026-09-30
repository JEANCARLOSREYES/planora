import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "../tests/demo",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:3200",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "npm run demo:preview",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: false,
  },
});
