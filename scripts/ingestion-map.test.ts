import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Holds the ingestion map (docs/providers/README.md) and data/README.md to the tree they describe.

const ROOT = join(import.meta.dirname, "..");
const MAP = read("docs/providers/README.md");
const DATA = read("data/README.md");
const WORKFLOWS = ".github/workflows";

/** A backticked span that names a repo path, as opposed to a URL, a key or a type. */
const REPO_PATH = /^(?:\.github|\.claude|apps|data|docs|packages|scripts|tools)\/\S*$/;
/** Where a path stops being literal: `<key>`, `{n}`, `*`. */
const PLACEHOLDER = /[<{*]/;
const CRON = /^[\d*,/-]+(?: [\d*,/-]+){4}$/;
const FETCHES = /\bpoliteFetch\(|\bfetch\(/;
const CACHES = /\b(?:unstable_cache|leagueCache)\(/;

interface Table {
  heading: string;
  header: string[];
  rows: string[][];
}

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

/** Every source file under `dir`, repo-relative, tests excluded. */
function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return walk(path);
    return /\.(?:tsx?|mjs)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function cells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

/** Every markdown table in a doc, with the `## ` heading it sits under. */
function tables(doc: string): Table[] {
  const found: Table[] = [];
  let heading = "";
  let block: string[] = [];
  for (const line of [...doc.split("\n"), ""]) {
    if (line.startsWith("## ")) heading = line.slice(3).trim();
    if (line.startsWith("|")) {
      block.push(line);
      continue;
    }
    if (block.length > 2) found.push({ heading, header: cells(block[0]), rows: block.slice(2).map(cells) });
    block = [];
  }
  return found;
}

function section(doc: string, heading: string): Table {
  const table = tables(doc).find((candidate) => candidate.heading === heading);
  if (table === undefined) throw new Error(`no table under "## ${heading}"`);
  return table;
}

function spans(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

/** A row's backticked spans, leaving out the Target column: it names paths the refactor has yet to make. */
function rowSpans(table: Table, row: string[]): string[] {
  const target = table.header.findIndex((head) => head.toLowerCase() === "target");
  return row.filter((_, at) => at !== target).flatMap(spans);
}

/** The part of a path that must exist: all of it, or the directory above its first placeholder. */
function literalPart(path: string): string {
  const cut = path.search(PLACEHOLDER);
  return cut < 0 ? path : path.slice(0, path.lastIndexOf("/", cut) + 1);
}

function named(table: Table): Set<string> {
  return new Set(table.rows.flatMap((row) => rowSpans(table, row)));
}

const namedPaths = [MAP, DATA]
  .flatMap(tables)
  .flatMap((table) => table.rows.flatMap((row) => rowSpans(table, row)))
  .filter((span) => REPO_PATH.test(span));

const fetching = [...walk("packages/core/src"), ...walk("scripts")]
  .filter((path) => !path.startsWith("packages/core/src/http/") && path !== "scripts/smoke.ts")
  .filter((path) => FETCHES.test(read(path)));

const workflows = readdirSync(join(ROOT, WORKFLOWS))
  .filter((name) => /\.ya?ml$/.test(name))
  .map((name) => ({ path: `${WORKFLOWS}/${name}`, text: read(`${WORKFLOWS}/${name}`) }));

const caching = walk("apps/companion/app").filter((path) => CACHES.test(read(path)));

function cronsIn(yaml: string): string[] {
  return [...yaml.matchAll(/^\s*-\s*cron:\s*["']([^"']+)["']/gm)].map((match) => match[1]).sort();
}

describe("the ingestion map", () => {
  it("finds what it checks, so no rule passes by matching nothing", () => {
    expect(namedPaths.length).toBeGreaterThan(50);
    expect(fetching.length).toBeGreaterThan(5);
    expect(workflows.filter((flow) => /^\s*schedule:/m.test(flow.text)).length).toBeGreaterThan(3);
    expect(caching.length).toBeGreaterThan(10);
  });

  it("names only paths that exist, outside the Target column", () => {
    expect(namedPaths.filter((path) => !existsSync(join(ROOT, literalPart(path))))).toEqual([]);
  });

  it("lists every file that fetches in Sources", () => {
    const sources = named(section(MAP, "Sources"));
    expect(fetching.filter((path) => !sources.has(path))).toEqual([]);
  });

  it("lists every workflow in Schedule, with its cron lines exactly", () => {
    const schedule = section(MAP, "Schedule");
    const wrong = workflows.flatMap((flow) => {
      const rows = schedule.rows.filter((row) => rowSpans(schedule, row).includes(flow.path));
      if (rows.length !== 1) return [`${flow.path}: ${rows.length} rows`];
      const listed = rowSpans(schedule, rows[0]).filter((span) => CRON.test(span)).sort();
      const actual = cronsIn(flow.text);
      return listed.join(" ; ") === actual.join(" ; ") ? [] : [`${flow.path}: map ${listed} vs yml ${actual}`];
    });
    expect(wrong).toEqual([]);
  });

  it("lists every file that holds a cached read in Cached reads", () => {
    const cached = named(section(MAP, "Cached reads"));
    expect(caching.filter((path) => !cached.has(path))).toEqual([]);
  });
});

describe("data/README.md", () => {
  it("has a row for every directory under data/", () => {
    const listed = named(tables(DATA)[0]);
    const dirs = readdirSync(join(ROOT, "data"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `data/${entry.name}/`);
    expect(dirs.filter((dir) => !listed.has(dir))).toEqual([]);
  });
});
