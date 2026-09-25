import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// football/** and league/** never import each other; a script does the wiring (CLAUDE.md).
// Every file is walked, tests included; the one crossing allowed is named below.

const SRC = dirname(fileURLToPath(import.meta.url));
/** The package root and `src/index.ts` re-export both layers, so importing either crosses. */
const BARREL = [SRC, join(SRC, "index"), join(SRC, "index.ts")];
/** Recorded in PLATFORM_NOTES' Decisions; a new crossing, or this one gone, fails. */
const ALLOWED = ["league/teamColours.test.ts → ../football/clubs"];

type Layer = "football" | "league";

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** Every module a file names: static, type-only, re-exported and dynamic; never one in a comment. */
function specifiers(text: string): string[] {
  return ts.preProcessFile(text, true, true).importedFiles.map((file) => file.fileName);
}

function crosses(file: string, specifier: string, into: Layer): boolean {
  if (specifier === "@epl/core") return true;
  if (!specifier.startsWith(".")) return false;
  const path = resolve(dirname(file), specifier);
  return BARREL.includes(path) || relative(SRC, path).split(sep)[0] === into;
}

/** Every `file → specifier` in `from` that reaches `into`. */
function crossings(from: Layer, into: Layer): string[] {
  return sources(join(SRC, from)).flatMap((file) =>
    specifiers(readFileSync(file, "utf8"))
      .filter((specifier) => crosses(file, specifier, into))
      .map((specifier) => `${relative(SRC, file)} → ${specifier}`),
  );
}

describe("the layer split", () => {
  it("football never imports league", () => {
    expect(sources(join(SRC, "football")).length).toBeGreaterThan(0);
    expect(crossings("football", "league")).toEqual([]);
  });

  it("league never imports football, but for the one recorded test", () => {
    expect(sources(join(SRC, "league")).length).toBeGreaterThan(0);
    expect(crossings("league", "football")).toEqual(ALLOWED);
  });

  it("would see a crossing, directly or through the barrel", () => {
    const file = join(SRC, "league", "fantrax", "map.ts");
    expect(crosses(file, "../../football/clubs", "football")).toBe(true);
    expect(crosses(file, "@epl/core", "football")).toBe(true);
    expect(crosses(file, "../../index", "football")).toBe(true);
    expect(crosses(file, "../types", "football")).toBe(false);
    expect(crosses(file, "../../config", "football")).toBe(false);
    expect(crosses(file, "vitest", "football")).toBe(false);
  });

  it("reads every import form and skips a specifier quoted in a comment", () => {
    const text = [
      `import type { A } from "../x";`,
      `export { b } from "../y";`,
      `import "../z";`,
      `const w = import("../w");`,
      `/** \`import { c } from "@epl/core"\` */`,
      `import {`,
      `  d,`,
      `} from "../t";`,
    ].join("\n");
    expect(specifiers(text)).toEqual(["../x", "../y", "../z", "../w", "../t"]);
  });
});
