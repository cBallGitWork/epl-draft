import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Holds `docs/providers/stats.md` to the tree, the way `revalidate.test.ts` holds the route literals.
// (a) every `Type.field` in a Domain field cell is declared in that type, at the line the cell cites;
// (b) every measurement a stat type carries has a row, so a new figure cannot arrive undocumented.

const ROOT = join(import.meta.dirname, "..");
const DOC = readFileSync(join(ROOT, "docs", "providers", "stats.md"), "utf8");

/** The types whose measurements are stats, by the file that declares them. */
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
    types: ["IntelPlayer", "IntelStarter", "IntelTaker", "IntelMatchPlayer", "IntelMatchEvent", "IntelMatchSide"],
  },
  { file: "packages/core/src/football/intel/shots.ts", types: ["Shot"] },
  { file: "packages/core/src/football/intel/touches.ts", types: ["TouchCentre"] },
  { file: "packages/core/src/football/intel/projections.ts", types: ["ProjectedGameweek"] },
  { file: "packages/core/src/football/intel/strength.ts", types: ["Venues", "StrengthRank", "PlannerCell"] },
  { file: "packages/core/src/football/intel/depth.ts", types: ["DepthHolder", "DepthSlot"] },
  { file: "packages/core/src/football/intel/pressers.ts", types: ["PresserSignal"] },
  { file: "packages/core/src/league/types.ts", types: ["StandingsRow", "RosterLimits", "LeaguePlayer"] },
  { file: "packages/core/src/league/stats.ts", types: ["PoolStatRow", "StatLine"] },
  { file: "packages/core/src/league/fantrax/playerStats.ts", types: ["PlayerStatLine"] },
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
  { file: "packages/core/src/join/cleanSheets.ts", types: ["PendingCleanSheets"] },
  { file: "apps/companion/app/players/teams/teamRows.ts", types: ["PoolMan", "TeamRow"] },
];

/** Stats written as text, a list or a table of tables, which no written-type rule can pick out. */
const NAMED = [
  "FootballPlayer.status",
  "FootballPlayer.news",
  "FootballPlayer.newsAdded",
  "PlMatchFacts.halfTime",
  "PlMatchFacts.referee",
  "IntelMatch.halfTime",
  "IntelMatch.referee",
  "IntelMatchSide.formation",
  "IntelMatchPlayer.position",
  "RosterSlot.status",
  "RosterSlot.position",
  "LeaguePlayerState.status",
  "LeaguePlayerState.eligiblePositions",
  "ScoringRules.goalie",
  "ScoringRules.outfield",
];

/** Fields that hold a key, a venue or a state flag, not a measurement. */
const NOT_MEASURES = new Set([
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
  "home",
  "settled",
  "percent",
  "owned",
]);

/** A count, a flag or a keyed bag of figures: what a stat type's measurements are written as. */
const MEASURE = /^(number|number \| null|boolean)$|^Record<.*\bnumber\b/;

/** The stats league's columns in the order the 25 Sep 2026 probe read them. */
const STATS_LEAGUE = {
  outfield: [
    "Rk", "Sta", "Opp", "Sal", "FPts", "FP/G", "Ros", "+/-", "GP", "GS", "Min", "G", "GIB", "GOB", "A", "A2",
    "KP", "ABS", "AFKG", "AHW", "AOG", "APL", "APKG", "AR", "ASOP", "AF", "AT", "S", "S/G", "S/90", "SOT", "SOP",
    "SB", "Tk", "TkW", "Tu", "DIS", "FC", "FS", "ErS", "ErG", "YC", "RC", "Pen", "Off", "Off/G", "AP", "SFTP",
    "C", "AC", "CF", "CK", "CF", "CE", "DFP", "DFP3", "CC", "FKS", "Int", "IntB", "CLRA", "CLO", "CLR", "CoA",
    "DW", "DL", "AER", "BCC", "BCM", "BCS", "BR", "FKG", "LB", "LBA", "SBON", "SBOF", "PKG", "PKA", "PKM", "PKD",
    "OG", "GAO", "CS", "CS", "OUTP",
  ],
  keepers: [
    "Rk", "Sta", "Opp", "Sal", "FPts", "FP/G", "Ros", "+/-", "GP", "Min", "CS", "GA", "Sv", "YC", "RC", "ErS",
    "ErG", "PKS", "PKM", "DIS", "G", "A", "KP", "AF", "AP", "OG", "CE",
  ],
};

const DOMAIN_HEADER = "Domain field (path:line)";
const TOKEN = /`([A-Z][A-Za-z]*)\.([a-z][A-Za-z]*)`/g;
const PATH = /((?:packages|apps|scripts)\/[^`\s|]+?\.tsx?):(\d+)/g;
/** A named field or a cited path, in the order the cell writes them. */
const CITATION = /`([A-Z][A-Za-z]*)\.([a-z][A-Za-z]*)`|((?:packages|apps|scripts)\/[^`\s|]+?\.tsx?):(\d+)/g;

interface Field {
  written: string;
  line: number;
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

/** A top-level interface or object type's fields: each one's written type and 1-based line. */
function declared(file: string, type: string): Map<string, Field> | null {
  const lines = linesOf(file);
  if (lines === null) return null;
  const head = new RegExp(`^(export )?(interface ${type}\\b|type ${type} =)`);
  const start = lines.findIndex((line) => head.test(line));
  if (start < 0) return null;
  const fields = new Map<string, Field>();
  for (let at = start + 1; at < lines.length && !/^}/.test(lines[at] ?? ""); at += 1) {
    const field = /^ {2}(\w+)\??: (.+?);?$/.exec(lines[at] ?? "");
    if (field) fields.set(field[1] ?? "", { written: field[2] ?? "", line: at + 1 });
  }
  return fields;
}

interface Row {
  cells: string[];
  domain: string;
  section: string;
  /** Which table of its section the row sits in, from 0. */
  table: number;
}

/** Every table row that carries a Domain field column, with the heading and table it sits under. */
function domainRows(): Row[] {
  const out: Row[] = [];
  let column = -1;
  let section = "";
  let table = -1;
  for (const line of DOC.split("\n")) {
    if (line.startsWith("## ")) {
      section = line.slice(3);
      table = -1;
    }
    if (!line.startsWith("|")) {
      column = -1;
      continue;
    }
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim());
    if (cells.includes(DOMAIN_HEADER)) {
      column = cells.indexOf(DOMAIN_HEADER);
      table += 1;
    } else if (column >= 0 && !/^-+$/.test(cells[0] ?? "")) {
      out.push({ cells, domain: cells[column] ?? "", section, table });
    }
  }
  return out;
}

const rows = domainRows();
const tokens = rows.flatMap(({ domain }) =>
  [...domain.matchAll(TOKEN)].map((m) => ({ type: m[1] ?? "", field: m[2] ?? "", cell: domain })),
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
      const found = paths.some((file) => declared(file, type)?.has(field));
      return found ? [] : [`${type}.${field} (cell names ${paths.join(", ") || "no file"})`];
    });
    expect(wrong).toEqual([]);
  });

  it("cites the first line of the fields named before the path", () => {
    const wrong = rows.flatMap(({ domain }) => {
      const out: string[] = [];
      let named: string[] = [];
      for (const m of domain.matchAll(CITATION)) {
        if (m[1] !== undefined) {
          named.push(`${m[1]}.${m[2] ?? ""}`);
          continue;
        }
        const file = m[3] ?? "";
        const at = Number(m[4]);
        const lines = linesOf(file);
        const found = named.map((name) => {
          const [type = "", field = ""] = name.split(".");
          return declared(file, type)?.get(field)?.line ?? Infinity;
        });
        const first = Math.min(...found);
        if (lines === null) out.push(`${file} does not exist`);
        else if (named.length === 0 ? at > lines.length : at !== first) {
          out.push(`${file}:${at} should be :${first} (${named.join(", ") || "past the end"})`);
        }
        named = [];
      }
      return out;
    });
    expect(wrong).toEqual([]);
  });

  it("has a row for every measurement a stat type carries", () => {
    const missing = STAT_TYPES.flatMap(({ file, types }) =>
      types.flatMap((type) => {
        const fields = declared(file, type);
        if (fields === null) return [`${type} is not declared in ${file}`];
        return [...fields]
          .filter(([name, { written }]) => MEASURE.test(written) && !NOT_MEASURES.has(name))
          .map(([name]) => `${type}.${name}`)
          .filter((key) => !documented.has(key));
      }),
    );
    expect(missing).toEqual([]);
  });

  it("has a row for every stat written as text, a list or a table", () => {
    expect(NAMED.filter((key) => !documented.has(key))).toEqual([]);
  });

  it("gives every stat type at least one measurement, so no entry in the list is vacuous", () => {
    const empty = STAT_TYPES.flatMap(({ file, types }) =>
      types.filter((type) => ![...(declared(file, type)?.values() ?? [])].some(({ written }) => MEASURE.test(written))),
    );
    expect(empty).toEqual([]);
  });

  it("lists the stats league's columns in the probe's order, each at its own index", () => {
    const league = rows.filter((row) => row.section === "Fantrax, the stats league");
    const read = (table: number) =>
      league
        .filter((row) => row.table === table)
        .map((row) => ({ name: (row.cells[1] ?? "").replaceAll("`", ""), index: /cells\[(\d+)\]/.exec(row.cells[2] ?? "")?.[1] }));
    for (const [table, expected] of [STATS_LEAGUE.outfield, STATS_LEAGUE.keepers].entries()) {
      const columns = read(table);
      expect(columns.map((column) => column.name)).toEqual(expected);
      expect(columns.map((column) => Number(column.index))).toEqual(expected.map((_, at) => at));
    }
  });

  it("marks every stats-league column available, not captured, until a capture exists", () => {
    const league = rows.filter((row) => row.section === "Fantrax, the stats league");
    expect(league).toHaveLength(STATS_LEAGUE.outfield.length + STATS_LEAGUE.keepers.length);
    expect(league.filter((row) => row.domain !== "available, not captured")).toEqual([]);
  });
});
