import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Holds `docs/providers/stats.md` to the tree, the way `revalidate.test.ts` holds the route literals.
// (a) every `Type.field` in a Domain field cell is declared in that type, at the line the cell cites;
// (b) every measurement a stat type carries has a row, and no row can be deleted without a test failing.

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
  { file: "packages/core/src/football/attributes.ts", types: ["Scouted"] },
  { file: "packages/core/src/football/shotLine.ts", types: ["ShotLine"] },
  { file: "packages/core/src/football/selectors.ts", types: ["MatchContribution"] },
  { file: "packages/core/src/fpl-entry/types.ts", types: ["FplEntry", "FplMiniLeague", "FplPick", "FplScoreLine", "FplSquad"] },
  { file: "packages/core/src/football/premierleague/matchFacts.ts", types: ["PlMatchFacts"] },
  { file: "packages/core/src/football/premierleague/matchStats.ts", types: ["MatchStatRow"] },
  { file: "packages/core/src/football/premierleague/teamSheet.ts", types: ["PlSquadMan"] },
  { file: "packages/core/src/football/premierleague/sheetEvents.ts", types: ["PlManMatch", "PlSubstitution"] },
  { file: "packages/core/src/football/premierleague/goals.ts", types: ["PlGoal"] },
  { file: "packages/core/src/football/premierleague/assists.ts", types: ["StreamCredit"] },
  { file: "packages/core/src/football/premierleague/breaks.ts", types: ["RoundBreak"] },
  { file: "packages/core/src/football/premierleague/map.ts", types: ["PlCommentaryLine"] },
  { file: "packages/core/src/football/rankings.ts", types: ["Ranked"] },
  {
    file: "packages/core/src/football/intel/types.ts",
    types: ["IntelPlayer", "IntelStarter", "IntelTaker", "IntelMatchPlayer", "IntelMatchEvent", "IntelMatchSide"],
  },
  { file: "packages/core/src/football/intel/shots.ts", types: ["Shot"] },
  { file: "packages/core/src/football/intel/touches.ts", types: ["TouchCentre"] },
  { file: "packages/core/src/football/intel/projections.ts", types: ["ProjectedGameweek"] },
  { file: "packages/core/src/football/intel/strength.ts", types: ["Venues", "StrengthRank", "PlannerCell", "PlannerRow"] },
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
  { file: "packages/core/src/league/fantrax/draft.ts", types: ["DraftPick"] },
  { file: "packages/core/src/join/cleanSheets.ts", types: ["PendingCleanSheets"] },
  { file: "packages/core/src/join/contribution.ts", types: ["Contribution"] },
  { file: "packages/core/src/gazette/powerRanking.ts", types: ["PowerRow"] },
  { file: "packages/core/src/gazette/predictions/record.ts", types: ["Marked", "Miss"] },
  { file: "packages/core/src/gazette/predictions/pick.ts", types: ["PickSide", "PredictionCall"] },
  { file: "packages/core/src/gazette/predictions/sides.ts", types: ["RecentGame", "SideForm", "SquadMan"] },
  { file: "packages/core/src/gazette/types.ts", types: ["Pick", "StorySide", "StoryResult"] },
  { file: "packages/core/src/gazette/extras.ts", types: ["StoryRank"] },
  { file: "packages/core/src/gazette/wire.ts", types: ["WireTeam", "WirePlayer", "WireFacts"] },
  { file: "packages/core/src/football/premierleague/clubSeason.ts", types: ["PlClubSeason"] },
  { file: "apps/companion/app/scoringDay.ts", types: ["LeagueDayLine"] },
];

/** Rows no written-type rule can pick out: text, lists, keys and objects, and the functions a row cites. */
const NAMED = [
  "FootballPlayer.status",
  "FootballPlayer.news",
  "FootballPlayer.newsAdded",
  "FootballPlayer.birthDate",
  "FootballPlayer.optaCode",
  "MatchEvent.fixtureCode",
  "PlCommentaryLine.type",
  "PlCommentaryLine.minute",
  "PlSquadMan.position",
  "PlManMatch.goals",
  "PlManMatch.assists",
  "PlManMatch.ownGoals",
  "MatchEvent.kind",
  "mapRoundGoals()",
  "mapMatchEvents()",
  "streamRedCards()",
  "PlTeamSheet.formation",
  "IntelPlayer.position",
  "IntelPlayer.secondaryPositions",
  "IntelPlayer.positionSource",
  "IntelPlayer.line",
  "IntelClubXi.formation",
  "IntelClubXi.starters",
  "IntelCareers.players",
  "Shot.pass",
  "TouchPlayer.fixtures",
  "LiveSquadPoints.players",
  "injuryMinutes()",
  "playerCodes()",
  "againstPick()",
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
  "totalsOver()",
  "Contribution.measured",
  "FplSquad.gameweek",
  "LivePlayerPoints.counts",
  "LeagueTransaction.kind",
  "LeagueTransaction.via",
  "LeagueTransaction.fromTeamId",
  "LeagueTransaction.toTeamId",
  "LeagueTransaction.processedAt",
  "LeagueTransaction.period",
  "LeagueTransaction.executed",
  "ClubDepth.formation",
  "ClubStrength.attack",
  "ClubStrength.defence",
  "ClubStrength.games",
  "PresserSignal.condition",
  "PredictionCall.score",
  "EditionTie.score",
  "PredictionSide.backLine",
  "callTie()",
];

/** Fields that hold a key, a venue or a state flag, not a measurement. */
const NOT_MEASURES = new Set([
  "id",
  "code",
  "playerId",
  "fixtureId",
  "clubId",
  "clubCode",
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
  "playerCode",
  "digits",
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

/** The rows of each section's tables with no Domain field column: only a count notices one go. */
const PLAIN_ROWS: Record<string, number> = {
  "Fetched but read by nobody": 31,
  "FPL bootstrap keys never typed": 11,
  "Computed in the app, not core": 13,
  "Stored history and live-only reads": 18,
  "Counted and refused": 30,
  "Where the record disagrees with the tree": 7,
};

const STATS_LEAGUE_SECTION = "Fantrax, the stats league";
const DOMAIN_HEADER = "Domain field (path:line)";
const TOKEN = /`([A-Z][A-Za-z]*)\.([a-z][A-Za-z]*)`/g;
const PATH = /((?:packages|apps|scripts)\/[^`\s|]+?\.tsx?):(\d+)/g;
const CALL = /`(\w+)\(\)`/g;
/** A named field, a named function or a cited path, in the order the cell writes them. */
const CITATION = /`([A-Z][A-Za-z]*)\.([a-z][A-Za-z]*)`|`(\w+)\(\)`|((?:packages|apps|scripts)\/[^`\s|]+?\.tsx?):(\d+)/g;

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
  /** The Domain field cell, or null in a table that has no such column. */
  domain: string | null;
  section: string;
  /** Which table of its section the row sits in, from 0. */
  table: number;
}

/** Every table body row, with the heading and table it sits under. */
function tableRows(): Row[] {
  const out: Row[] = [];
  let column: number | null = null;
  let section = "";
  let table = -1;
  for (const line of DOC.split("\n")) {
    if (line.startsWith("## ")) {
      section = line.slice(3);
      table = -1;
    }
    if (!line.startsWith("|")) {
      column = null;
      continue;
    }
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim());
    if (column === null) {
      column = cells.indexOf(DOMAIN_HEADER);
      table += 1;
    } else if (!/^-+$/.test(cells[0] ?? "")) {
      out.push({ cells, domain: column < 0 ? null : (cells[column] ?? ""), section, table });
    }
  }
  return out;
}

/** A Domain cell's named fields and functions, written `Type.field` and `name()`. */
function citesOf(domain: string): string[] {
  return [
    ...[...domain.matchAll(TOKEN)].map((m) => `${m[1] ?? ""}.${m[2] ?? ""}`),
    ...[...domain.matchAll(CALL)].map((m) => `${m[1] ?? ""}()`),
  ];
}

const all = tableRows();
const rows = all.filter((row): row is Row & { domain: string } => row.domain !== null);
const tokens = rows.flatMap(({ domain }) =>
  [...domain.matchAll(TOKEN)].map((m) => ({ type: m[1] ?? "", field: m[2] ?? "", cell: domain })),
);
const documented = new Set(rows.flatMap(({ domain }) => citesOf(domain)));

/** Every measurement a stat type carries, as `Type.field`. */
const measures = STAT_TYPES.flatMap(({ file, types }) =>
  types.flatMap((type) =>
    [...(declared(file, type) ?? [])]
      .filter(([name, { written }]) => MEASURE.test(written) && !NOT_MEASURES.has(name))
      .map(([name]) => `${type}.${name}`),
  ),
);
/** What the tests below insist has a row: deleting the one row that cites it fails. */
const required = new Set([...measures, ...NAMED]);

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

  it("cites the first line of the fields, or the line of the function, named before the path", () => {
    const wrong = rows.flatMap(({ domain }) => {
      const out: string[] = [];
      let named: string[] = [];
      let called: string[] = [];
      for (const m of domain.matchAll(CITATION)) {
        if (m[1] !== undefined) {
          named.push(`${m[1]}.${m[2] ?? ""}`);
          continue;
        }
        if (m[3] !== undefined) {
          called.push(m[3]);
          continue;
        }
        const file = m[4] ?? "";
        const at = Number(m[5]);
        const lines = linesOf(file);
        const found = named.map((name) => {
          const [type = "", field = ""] = name.split(".");
          return declared(file, type)?.get(field)?.line ?? Infinity;
        });
        const first = Math.min(...found);
        const unmatched = called.filter((name) => !new RegExp(`function ${name}\\(`).test(lines?.[at - 1] ?? ""));
        if (lines === null) out.push(`${file} does not exist`);
        else if (unmatched.length > 0) out.push(`${file}:${at} does not declare ${unmatched.join(", ")}`);
        else if (named.length === 0 ? at > lines.length : at !== first) {
          out.push(`${file}:${at} should be :${first} (${named.join(", ") || "past the end"})`);
        }
        named = [];
        called = [];
      }
      return [...out, ...called.map((name) => `${name}() is named with no path after it`)];
    });
    expect(wrong).toEqual([]);
  });

  it("has a row for every measurement a stat type carries", () => {
    const undeclared = STAT_TYPES.flatMap(({ file, types }) =>
      types.filter((type) => declared(file, type) === null).map((type) => `${type} is not declared in ${file}`),
    );
    expect([...undeclared, ...measures.filter((key) => !documented.has(key))]).toEqual([]);
  });

  it("has a row for every field and function the NAMED list holds", () => {
    expect(NAMED.filter((key) => !documented.has(key))).toEqual([]);
  });

  it("gives every row a field or function of its own that the tests require, so deleting any row fails", () => {
    const cited = rows
      .filter((row) => row.section !== STATS_LEAGUE_SECTION)
      .map((row) => ({ stat: row.cells[0] ?? "", cites: new Set(citesOf(row.domain)) }));
    const times = new Map<string, number>();
    for (const { cites } of cited) for (const key of cites) times.set(key, (times.get(key) ?? 0) + 1);
    const shared = cited.filter(({ cites }) => ![...cites].some((key) => required.has(key) && times.get(key) === 1));
    expect(shared.map(({ stat }) => stat)).toEqual([]);
  });

  it("keeps every row of the tables that have no Domain field column", () => {
    const counted: Record<string, number> = {};
    for (const row of all) if (row.domain === null) counted[row.section] = (counted[row.section] ?? 0) + 1;
    expect(counted).toEqual(PLAIN_ROWS);
  });

  it("gives every stat type at least one measurement, so no entry in the list is vacuous", () => {
    const empty = STAT_TYPES.flatMap(({ file, types }) =>
      types.filter((type) => ![...(declared(file, type)?.values() ?? [])].some(({ written }) => MEASURE.test(written))),
    );
    expect(empty).toEqual([]);
  });

  it("lists the stats league's columns in the probe's order, each at its own index", () => {
    const league = rows.filter((row) => row.section === STATS_LEAGUE_SECTION);
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
    const league = rows.filter((row) => row.section === STATS_LEAGUE_SECTION);
    expect(league).toHaveLength(STATS_LEAGUE.outfield.length + STATS_LEAGUE.keepers.length);
    expect(league.filter((row) => row.domain !== "available, not captured")).toEqual([]);
  });
});
