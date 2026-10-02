import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  KEEPER,
  OUTFIELD,
  fetchBootstrap,
  fetchLeagueInfo,
  fetchPoolStats,
  mapLeagueInfo,
  mapPlayerStats,
  projectionIntel,
  scoringOf,
  type Bridge,
  type IntelProjections,
  type LeagueMatch,
  type LeagueProjectionFile,
  type PlayerStatLine,
} from "@epl/core";
import { INTEL_SEASON, readIntel } from "./intel";
import { SCORING_LEAGUE } from "./leagues";
import { INTEL_ROOT, MAPPINGS_ROOT } from "./paths";
import { buildPack, type FplSide, type PoolSide } from "./draftPack/build";

// The draft pack (Craig, 2 Oct 2026: "projections for all players using real league's points"): the sister model's
// projection repriced at each man's slots by the scoring league's rules, its DefCon and keeper work off his own matches.
//
//   npm run draft-pack                      # data/intel/league-projections/26-27.json
//   npm run draft-pack -- --out pack.json   # anywhere else

/** Minutes at his slot's average each man's own DefCon and keeper rates are drawn toward: three full matches. */
const SHRINK_MINUTES = 270;
const PAGE = 1000;

const METHOD =
  "FPL's projected parts turned back into counts at FPL's prices for his FPL position, then priced at each Fantrax slot " +
  "he is eligible for by the real league's rules (goals, assists, clean sheets, minutes). Bonus dropped. FPL's DefCon " +
  "and saves replaced by his own real-league DefCon and keeper points per 90 over the gameweeks played so far, each " +
  `match priced on its own, drawn toward his slot's average as if he had also played ${SHRINK_MINUTES} minutes at it, ` +
  "times projected minutes. 'conceded' is every deduction (goals conceded, cards, own goals, missed penalties), FPL's " +
  "own, with goals conceded re-costed where his Fantrax slot charges them and FPL's position did not, or the reverse.";

async function main(): Promise<void> {
  const out = argument("--out") ?? join(INTEL_ROOT, "league-projections", `${INTEL_SEASON}.json`);
  const info = mapLeagueInfo(await fetchLeagueInfo(SCORING_LEAGUE.leagueId));
  const scoring = scoringOf(info);
  if (scoring === null) throw new Error(`the "${SCORING_LEAGUE.key}" league described no scoring`);
  const exported = readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`);
  const projections = projectionIntel(exported);
  if (projections.size === 0) throw new Error("no projections export held");

  // Every period begun, one group after the other: Fantrax throttles a burst.
  const now = Date.now();
  const begun = info.scoringPeriods.filter((period) => Date.parse(period.start) <= now).map((period) => period.number);
  const matches = new Map<string, LeagueMatch[]>();
  const who = new Map<string, PlayerStatLine>();
  for (const period of begun) {
    for (const group of [OUTFIELD, KEEPER]) {
      for (const line of mapPlayerStats(await fetchPoolStats(SCORING_LEAGUE.leagueId, PAGE, undefined, group, period))) {
        if (!who.has(line.fantraxId)) who.set(line.fantraxId, line);
        if (line.stats.GP !== 1) continue;
        matches.set(line.fantraxId, [...(matches.get(line.fantraxId) ?? []), { minutes: line.stats.Min ?? 0, counts: line.stats }]);
      }
    }
  }

  const bootstrap = await fetchBootstrap();
  const fpl = new Map<number, FplSide>(bootstrap.elements.map((e) => [e.code, { line: e.element_type, status: e.status, news: e.news ?? "" }]));
  const pool: PoolSide[] = info.players.map((player) => {
    const line = who.get(player.fantraxId);
    return {
      fantraxId: player.fantraxId,
      name: line?.name ?? player.fantraxId,
      club: line?.clubShort ?? null,
      primary: line?.defaultPosition ?? player.eligiblePositions[0] ?? null,
      eligible: player.eligiblePositions,
      adp: line?.stats.ADP ?? null,
    };
  });
  const bridge = JSON.parse(readFileSync(join(MAPPINGS_ROOT, "fantrax.json"), "utf8")) as Bridge;
  const gameweeks = [...new Set([...projections.values()].flatMap((player) => player.gameweeks.map((week) => week.gw)))].sort((a, b) => a - b);
  const { rows, priors } = buildPack({ scoring, pool, matches, bridge, projections, fpl, gameweeks, weight: SHRINK_MINUTES });

  const pack: LeagueProjectionFile = {
    generatedAt: new Date(now).toISOString(),
    method: METHOD,
    league: SCORING_LEAGUE.key,
    periodsObserved: begun,
    projectionsExportedAt: exported?.manifest.exportedAt ?? null,
    gameweeks,
    priors,
    players: rows,
  };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(pack));
  console.log(`draft-pack: ${rows.length} men over GW${gameweeks[0]}–${gameweeks.at(-1)}, periods ${begun.join(",")} observed → ${out}`);
}

function argument(flag: string): string | null {
  const at = process.argv.indexOf(flag);
  return at === -1 ? null : (process.argv[at + 1] ?? null);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
