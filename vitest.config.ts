import { defineConfig } from "vitest/config";

// One test run across the whole workspace. The pure logic lives in packages/*,
// which is exactly where it belongs — keeping it out of components is what makes
// it unit-testable, and what lets the 27/28 engine inherit it.
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts"],
  },
});
