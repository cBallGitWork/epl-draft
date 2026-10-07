import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // Every link goes through shell/Link, which turns Next's viewport prefetch off.
    files: ["**/*.{ts,tsx}"],
    ignores: ["app/components/shell/Link.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "next/link", importNames: ["default"], message: "Import Link from @/app/components/shell/Link." }] },
      ],
    },
  },
]);

export default eslintConfig;
