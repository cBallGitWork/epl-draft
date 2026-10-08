import { readFileSync } from "node:fs";
import {
  careerIntel,
  cupIntel,
  depthIntel,
  fetchBootstrap,
  instantOf,
  intelFreshness,
  lineIntel,
  matchIntel,
  projectionIntel,
  roundPlayed,
  shotIntel,
  squadIntel,
  strengthIntel,
  touchIntel,
  xiFault,
} from "@epl/core";
import type {
  IntelCareers,
  IntelCups,
  IntelDepth,
  IntelKind,
  IntelLines,
  IntelManifest,
  IntelMatches,
  IntelPressers,
  IntelProjections,
  IntelSetPieces,
  IntelShots,
  IntelSquads,
  IntelStats,
  IntelStrength,
  IntelTouches,
  IntelXi,
  LeagueProjectionFile,
} from "@epl/core";
import { INTEL_SEASON, intelPath } from "./intel";

// Whether every intel file is present, parses, and is inside its kind's age limit
// (`INTEL_AGE_LIMIT_DAYS`), and whether the predicted eleven is for a round still to come.
// Exits 1 on any of them; the last line is the verdict the repo clock prints.

/** Last season's file, `25-26` beside `26-27`: the attribute grid rates both. */
const LAST_SEASON = INTEL_SEASON.replace(/\d+/g, (year) => String(Number(year) - 1).padStart(2, "0"));

interface Check {
  kind: IntelKind;
  season: string;
  /** What the file holds, in the count that would fall if the export were rotting. */
  summary: (file: never) => string;
}

const check = <T>(kind: IntelKind, summary: (file: T) => string, season = INTEL_SEASON): Check => ({ kind, season, summary });

const CHECKS: Check[] = [
  check<IntelSquads>("squads", squadsSummary),
  check<IntelXi>("xi", (xi) => `gameweek ${xi.manifest?.gameweek ?? "unnamed"}, ${Object.keys(xi.clubs ?? {}).length} clubs`),
  check<IntelSetPieces>("set-pieces", (pieces) => `${Object.keys(pieces.clubs ?? {}).length} clubs`),
  check<IntelMatches>("matches", (matches) => `${matchIntel(matches).size} fixtures`),
  check<IntelTouches>("touches", (touches) => `${touchIntel(touches).size} players, ${touches.manifest.rows} points`),
  check<IntelShots>("shots", shotsSummary),
  check<IntelStrength>("strength", (strength) => `${strengthIntel(strength).size} clubs rated`),
  check<IntelProjections>("projections", (run) => `${projectionIntel(run).size} players from GW${run.manifest.gameweek}`),
  check<IntelDepth>("depth", (depth) => `${depthIntel(depth).size} clubs, GW${depth.manifest.gameweek}`),
  check<IntelLines>("lines", (lines) => `${lineIntel(lines).size} players`),
  check<IntelLines>("lines", (lines) => `${lineIntel(lines).size} players`, LAST_SEASON),
  check<IntelCareers>("careers", (careers) => `${careerIntel(careers).size} players`),
  check<LeagueProjectionFile>("league-projections", (pack) => `${pack.players.length} men over GW${pack.gameweeks[0]}–${pack.gameweeks.at(-1)}`),
  check<IntelCups>("cups", cupsSummary),
  check<IntelPressers>("pressers", (said) => `GW${said.manifest.gameweek}, ${said.rows.length} signals, ${said.quotes?.length ?? 0} quotes`),
  check<IntelStats>("stats", statsSummary),
];

async function main(): Promise<void> {
  const now = new Date();
  const stale: string[] = [];
  const broken: string[] = [];

  for (const { kind, season, summary } of CHECKS) {
    const label = season === INTEL_SEASON ? kind : `${kind} ${season}`;
    const file = read<{ manifest: IntelManifest }>(intelPath(kind, season));
    if (file === null) {
      console.error(`\n✗ ${label}: absent, or will not parse.`);
      broken.push(`${label} absent`);
      continue;
    }
    if (file.manifest === undefined) {
      console.error(`\n✗ ${label}: no manifest, so no age.`);
      broken.push(`${label} has no manifest`);
      continue;
    }
    console.log(`\n${label}: ${summary(file as never)}, exported ${age(file.manifest.exportedAt)}`);
    for (const source of file.manifest.sources ?? []) console.log(`  built from ${source.path} (${age(source.mtime)})`);
    const fresh = intelFreshness(kind, file.manifest, INTEL_SEASON, now);
    if (fresh.stale) {
      console.error(`  ✗ stale: past its ${fresh.limitDays}-day limit. Re-export it.`);
      stale.push(`${label} ${fresh.ageDays ?? "?"}d`);
    }
  }

  broken.push(...(await xiFaults()));
  const verdict = [stale.length > 0 ? `stale: ${stale.join(", ")}` : null, ...broken].filter((part) => part !== null);
  console.log(`\nverdict: ${verdict.length === 0 ? `all ${CHECKS.length} files fresh and whole` : verdict.join("; ")}`);
  if (verdict.length > 0) process.exitCode = 1;
}

/** What is wrong with the predicted eleven beyond its age: a club that is not eleven, or a round already played. */
async function xiFaults(): Promise<string[]> {
  const xi = read<IntelXi>(intelPath("xi"));
  if (xi === null) return [];
  const round = xi.manifest?.gameweek;
  if (typeof round !== "number") {
    console.error("\n✗ the predicted eleven names no gameweek.");
    return ["xi names no gameweek"];
  }

  // Checked here as well as in `scout-xi`, because the club page and the paper both draw it.
  const faults = Object.entries(xi.clubs ?? {})
    .map(([club, entry]) => [club, xiFault(entry)] as const)
    .filter(([, fault]) => fault !== null);
  for (const [club, fault] of faults) console.error(`  ✗ xi ${club}: ${fault}`);
  const found = faults.length > 0 ? [`xi: ${faults.length} clubs are not an eleven`] : [];

  // `finished`, not `is_next`: FPL flips `is_next` at the deadline, mid-round.
  const played = await askFpl(round);
  if (played === null) {
    console.log(`\nxi: FPL would not say whether gameweek ${round} has been played; unchecked.`);
  } else if (played) {
    console.error(`\n✗ xi: the eleven is for gameweek ${round}, whose football has been played. The paper will not print it.`);
    found.push(`xi is for played GW${round}`);
  } else {
    console.log(`\nxi: gameweek ${round} still has football to come.`);
  }
  return found;
}

/** The squad numbers are reported, not resolved: three City men all claim 8, and no tie-break is not a guess. */
function squadsSummary(squads: IntelSquads): string {
  const players = [...squadIntel(squads).values()];
  const real = players.filter((player) => player.position !== null).length;
  const numbers = players.filter((player) => player.squadNumber !== null).length;
  const shared = squads.manifest.numberCollisions ?? 0;
  return (
    `${players.length} players, ${real} with a real position, ${numbers} squad numbers` +
    (shared > 0 ? ` (${shared} shared with a club-mate)` : "")
  );
}

/** Fixtures rather than shots: a season's shot total only rises, so it cannot show the export stopping. */
function shotsSummary(shots: IntelShots): string {
  const byCode = shotIntel(shots);
  const taken = [...byCode.values()].flat();
  const fixtures = new Set(taken.map((shot) => shot.fplFixtureId)).size;
  return `${taken.length} shots, ${byCode.size} players, ${fixtures} fixtures`;
}

/** The men who have played that the bridge cannot key, whose counts the file cannot hold. */
function statsSummary(stats: IntelStats): string {
  const unbridged = stats.unbridgedWithMinutes > 0 ? `, ${stats.unbridgedWithMinutes} unbridged (run \`npm run bridge\`)` : "";
  return `${stats.players.length} men, ${stats.columns.length} columns${unbridged}`;
}

/** Played as well as to come: a log that stops being rebuilt stops adding scores. */
function cupsSummary(cups: IntelCups): string {
  const ties = [...cupIntel(cups).values()].flat();
  const played = ties.filter((tie) => tie.score !== null).length;
  return `${ties.length} ties, ${played} played, ${ties.length - played} to come`;
}

/** Whether FPL has finished the round, or null when it will not answer: the other checks stand without the network. */
async function askFpl(round: number): Promise<boolean | null> {
  try {
    return roundPlayed(await fetchBootstrap(), round);
  } catch {
    return null;
  }
}

/** A committed JSON file, or null when it is absent or will not parse: saying so is this script's job. */
function read<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

/** "3h ago", or that nothing said. */
function age(at: string | null | undefined): string {
  if (!at) return "at an unrecorded time";
  const when = instantOf(at);
  if (when === null) return "at an unreadable time";
  const hours = Math.floor((Date.now() - when) / 3_600_000);
  if (hours < 1) return "less than an hour ago";
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

void main();
