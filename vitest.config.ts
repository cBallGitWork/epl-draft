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
    include: [
      "packages/*/src/**/*.test.ts",
      "scripts/**/*.test.ts",
      // **`apps/` joined on 2 Sep, and the reason is a bug it let through.**
      // The comment above says the pure logic "lives in packages/*, which is
      // exactly where it belongs" — an aspiration stated as a fact. Nine files
      // and ~540 lines of it sit in `apps/companion/app` importing only
      // `@epl/core` or nothing, and two of them shipped wrong: `movement` and
      // `kindOf` were pure functions in a component file where no test could
      // reach them, and nine tests then found six failures against the logic
      // they had been running in production.
      //
      // Widening is not permission to put domain logic in the app. It removes
      // the excuse for the logic that is already there being untested.
      "apps/*/app/**/*.test.ts",
      "tools/ui/**/*.test.mjs",
    ],
  },
});
