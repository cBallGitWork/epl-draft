import { defineConfig } from "vitest/config";

// One run across the workspace: core, the scripts' decisions, the app's pure logic and the UI instruments' pure parts.
// A pure function in the app is tested where it sits; that is no licence to put domain logic there.
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/*/src/**/*.test.ts",
      "scripts/**/*.test.ts",
      "apps/*/app/**/*.test.ts",
      "tools/ui/**/*.test.mjs",
    ],
  },
});
