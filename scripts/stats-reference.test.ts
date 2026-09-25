import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Holds `docs/providers/stats.md` to the tree, the way `revalidate.test.ts` holds the route literals.
// (a) every `Type.field` in a Domain field cell is declared in that type, in a file the cell names;
// (b) every number a stat type carries has a row, so a new figure cannot arrive undocumented.

const ROOT = join(import.meta.dirname, "..");
const DOC = readFileSync(join(ROOT, "docs", "providers", "stats.md"), "utf8");

/** The types whose numbers are stats, by the file that declares them. */
const STAT_TYPES: readonly { file: string; types: readonly string[] }[] = [
  {
    file: "packages/core/src/football/types.ts",
    types: ["SeasonTotals", "PlayerMatchStats", "Fixture", "FootballPlayer", "MatchEvent"],
  },
  { file: "packages/core/src/football/gameLog.ts", types: ["GameLogEntry"] },
  { file: "packages/core/src/football/seasons.ts", types: ["PastSeason"] },
  { file: "packages/core/src/football/matchSheet.ts", types: ["MatchSheetLine"] },
  { file: "packages/core/src/football/clubStats.ts", types: ["ClubRecord", "ClubStats"] },
  { file: "packages/core/src/football/table.ts", types: ["TableRow"] },
  { file: "packages/core/src/football/form.ts", types: ["PlayerForm"] },
  { file: "packages/core/src/football/attributes.ts", types: ["ShotLine", "Scouted"] },
  { file: "packages/core/src/football/selectors.ts", types: ["MatchContribution"] },
  { file: "packages/core/src/fpl-entry/types.ts", types: ["FplEntry", "FplMiniLeague", "FplPick", "FplSquad"] },
  { file: "packages/core/src/football/premierleague/matchFacts.ts", types: ["PlMatchFacts"] },
  { file: "packages/core/src/football/premierleague/matchStats.ts", types: ["MatchStatRow"] },
  { file: "packages/core/src/football/premierleague/teamSheet.ts", types: ["PlSquadMan"] },
  { file: "packages/core/src/football/premierleague/sheetEvents.ts", types: ["PlManMatch", "PlSubstitution"] },
  { file: "packages/core/src/football/premierleague/goals.ts", types: ["PlGoal"] },
  { file: "packages/core/src/football/premierleague/assists.ts", types: ["StreamCredit"] },
  {
    file: "packages/core/src/football/intel/types.ts",
    types: ["IntelPlayer", "IntelStarter", "IntelTaker", "IntelMatchPlayer", "IntelMatchEvent"],
  },
  { file: "packages/core/src/football/intel/shots.ts", types: ["Shot"] },
  { file: "packages/core/src/football/intel/touches.ts", types: ["TouchCentre"] },
  { file: "packages/core/src/football/intel/projections.ts", types: ["ProjectedGameweek"] },
  { file: "packages/core/src/football/intel/strength.ts", types: ["Venues", "StrengthRank", "PlannerCell"] },
  { file: "packages/core/src/football/intel/depth.ts", types: ["DepthHolder", "DepthSlot"] },
  { file: "packages/core/src/football/intel/pressers.ts", types: ["PresserSignal"] },
  { file: "packages/core/src/league/types.ts", types: ["StandingsRow", "RosterLimits", "LeaguePlayer"] },
  { file: "packages/core/src/league/stats.ts", types: ["PoolStatRow", "StatLine"] },
  {
    file: "packages/core/src/league/points.ts",
    types: ["LiveTeamScore", "TeamProjection", "LivePlayerPoints", "LivePlayerCategory"],
  },
  { file: "packages/core/src/league/breakdown.ts", types: ["BreakdownLine"] },
  { file: "packages/core/src/league/fantrax/seasonStats.ts", types: ["CategoryLine"] },
  { file: "packages/core/src/league/fantrax/results.ts", types: ["PeriodResult"] },
  { file: "packages/core/src/league/form.ts", types: ["FormGame"] },
  { file: "packages/core/src/league/fantrax/profileTables.ts", types: ["PlayerMatch"] },
  { file: "packages/core/src/league/fantrax/playerNews.ts", types: ["PlayerStory"] },
  { file: "apps/companion/app/players/teams/teamRows.ts", types: ["PoolMan", "TeamRow"] },
];

/** Numbers that hold a key (a code, an id, a round), not a measurement. */
const KEYS = new Set([
  "id",
  "code",
  "playerId",
  "fixtureId",
  "clubId",
  "opponentClubId",
  "homeClubId",
  "awayClubId",
  "fixtureCode",
  "fplFixtureId",
  "gameweek",
  "gw",
  "period",
  "club",
  "teamId",
  "scorer",
  "assister",
  "on",
  "off",
]);

const DOMAIN_HEADER = "Domain field (path:line)";
const TOKEN = /`([A-Z][A-Za-z]*)\.([a-z][A-Za-z]*)`/g;
const PATH = /((?:packages|apps|scripts)\/[^`\s|]+?\.tsx?):(\d+)/g;

interface Declared {
  start: number;
  end: number;
  fields: Map<string, string>;
}

const files = new Map<string, string[]>();
function linesOf(file: string): string[] | null {
  if (!files.has(file)) {
    const path = join(ROOT, file);
    files.set(file, existsSync(path) ? readFileSync(path, "utf8").split("\n") : []);
  }
  const lines = files.get(file) ?? [];
  return lines.length === 0 ? null : lines;
}

/** A top-level interface or object type, its 1-based line span and its fields' written types. */
function declared(file: string, type: string): Declared | null {
  const lines = linesOf(file);
  if (lines === null) return null;
  const head = new RegExp(`^(export )?(interface ${type}\\b|type ${type} =)`);
  const start = lines.findIndex((line) => head.test(line));
  if (start < 0) return null;
  const fields = new Map<string, string>();
  let end = start;
  while (end + 1 < lines.length && !/^}/.test(lines[end + 1] ?? "")) {
    end += 1;
    const field = /^ {2}(\w+)\??: (.+?);?$/.exec(lines[end] ?? "");
    if (field) fields.set(field[1] ?? "", field[2] ?? "");
  }
  return { start: start + 1, end: end + 2, fields };
}

/** Every table row that carries a Domain field column, with the heading it sits under. */
function domainCells(): { cell: string; section: string }[] {
  const out: { cell: string; section: string }[] = [];
  let column = -1;
  let section = "";
  for (const line of DOC.split("\n")) {
    if (line.startsWith("## ")) section = line.slice(3);
    if (!line.startsWith("|")) {
      column = -1;
      continue;
    }
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim());
    if (cells.includes(DOMAIN_HEADER)) column = cells.indexOf(DOMAIN_HEADER);
    else if (column >= 0 && !/^-+$/.test(cells[0] ?? "")) out.push({ cell: cells[column] ?? "", section });
  }
  return out;
}

const rows = domainCells();
const tokens = rows.flatMap(({ cell }) =>
  [...cell.matchAll(TOKEN)].map((m) => ({ type: m[1] ?? "", field: m[2] ?? "", cell })),
);
const documented = new Set(tokens.map((t) => `${t.type}.${t.field}`));

describe("docs/providers/stats.md", () => {
  it("is parsed at all, so a broken reader cannot pass by finding nothing", () => {
    expect(rows.length).toBeGreaterThan(150);
    expect(tokens.length).toBeGreaterThan(200);
  });

  it("names, for every Type.field, a file that declares the field inside that type", () => {
    const wrong = tokens.flatMap(({ type, field, cell }) => {
      const paths = [...cell.matchAll(PATH)].map((m) => m[1] ?? "");
      const found = paths.some((file) => declared(file, type)?.fields.has(field));
      return found ? [] : [`${type}.${field} (cell names ${paths.join(", ") || "no file"})`];
    });
    expect(wrong).toEqual([]);
  });

  it("cites lines that fall inside a type the cell names, or inside the file when it names none", () => {
    const wrong = rows.flatMap(({ cell }) => {
      const types = [...cell.matchAll(TOKEN)].map((m) => m[1] ?? "");
      return [...cell.matchAll(PATH)].flatMap((m) => {
        const file = m[1] ?? "";
        const at = Number(m[2]);
        const lines = linesOf(file);
        if (lines === null) return [`${file} does not exist`];
        if (types.length === 0) return at <= lines.length ? [] : [`${file}:${at} is past the end`];
        const inside = types.some((type) => {
          const span = declared(file, type);
          return span !== null && at > span.start && at < span.end;
        });
        return inside ? [] : [`${file}:${at} is not inside ${[...new Set(types)].join(" or ")}`];
      });
    });
    expect(wrong).toEqual([]);
  });

  it("has a row for every number a stat type carries", () => {
    const missing = STAT_TYPES.flatMap(({ file, types }) =>
      types.flatMap((type) => {
        const span = declared(file, type);
        if (span === null) return [`${type} is not declared in ${file}`];
        return [...span.fields]
          .filter(([name, written]) => /^number( \| null)?$/.test(written) && !KEYS.has(name))
          .map(([name]) => `${type}.${name}`)
          .filter((key) => !documented.has(key));
      }),
    );
    expect(missing).toEqual([]);
  });

  it("gives every stat type at least one number, so no entry in the list is vacuous", () => {
    const empty = STAT_TYPES.flatMap(({ file, types }) =>
      types.filter((type) => {
        const fields = declared(file, type)?.fields ?? new Map<string, string>();
        return ![...fields.values()].some((written) => /^number( \| null)?$/.test(written));
      }),
    );
    expect(empty).toEqual([]);
  });

  it("marks every stats-league column available, not captured, until a capture exists", () => {
    const league = rows.filter((row) => row.section === "Fantrax, the stats league");
    expect(league.length).toBeGreaterThan(100);
    expect(league.filter((row) => row.cell !== "available, not captured")).toEqual([]);
  });
});
