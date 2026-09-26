import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: "integration",
    environment: "node",
    globals: true,
    globalSetup: ["./tests/setup/integration-global-setup.ts"],
    setupFiles: ["./tests/setup/integration-setup.ts"],
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
    // Single worker + serial sequence: all files share one container without DB contamination
    maxWorkers: 1,
    sequence: { concurrent: false },
  },
});
