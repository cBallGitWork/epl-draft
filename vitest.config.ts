import { defineConfig } from "vitest/config";

// One test run across the whole workspace. The pure logic lives in packages/*,
// which is exactly where it belongs — keeping it out of components is what makes
// it unit-testable, and what lets the 27/28 engine inherit it.
//
// `scripts/` joined the glob on 31 Aug. The writer used to be one file that
// gathered and posted; it is now a newsroom whose script edge holds real
// decisions — which cargo a column's JSON carries into a story, which desk
// writes which assignment — and the first review of it found the fold from a
// model's top-level `ranks`/`quotes` into `extras` silently missing, with
// every renderer treating the absence as ordinary. Logic a reviewer has to
// read to check is logic a test should hold.
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
