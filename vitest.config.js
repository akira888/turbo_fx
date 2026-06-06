import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["js-test/**/*.test.js"],
    setupFiles: ["js-test/setup.js"]
  }
});
