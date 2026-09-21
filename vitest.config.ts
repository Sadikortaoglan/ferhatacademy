import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    name: "unit",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/unit/**/*.test.ts?(x)", "tests/component/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/server/**", "src/features/**/actions/**", "src/lib/**"],
      exclude: ["src/lib/auth-client.ts", "src/lib/auth.ts"],
    },
  },
});
