import {
  FANTRAX_LEAGUE_ID,
  buildReportsBrief,
  datedKickoffs,
  deskDay,
  fetchFixtures,
  fetchLeagueInfo,
  getFootballSnapshot,
  londonDayOf,
  mapFixtures,
  mapLeagueInfo,
  periodGameweeks,
  requireLeague,
} from "@epl/core";
import { gatherRoundFacts } from "./edition/facts";
import { matchdayInput } from "./edition/matchday";

// A match-day report for a past gameweek, written to scratch and never to the paper, so Craig can read it before anything files.
// GAZETTA_GAMEWEEK=5 with GAZETTA_FIXTURES=48 (FPL fixture ids) or GAZETTA_DAY=2026-09-19; DRY_RUN=1 prints the brief only.

const say = (message: string) => console.log(message);

async function main(): Promise<void> {
  if (process.env.CI) throw new Error("report:proof is a local proof and never runs in CI.");
  requireLeague(FANTRAX_LEAGUE_ID);
  const gameweek = Number(process.env.GAZETTA_GAMEWEEK);
  if (!Number.isInteger(gameweek) || gameweek < 1) throw new Error("GAZETTA_GAMEWEEK is required, e.g. 5.");
  const ids = (process.env.GAZETTA_FIXTURES ?? "").split(",").filter(Boolean).map(Number);
  const day = process.env.GAZETTA_DAY ?? "";
  if (ids.length === 0 && day === "") throw new Error("Name the fixtures (GAZETTA_FIXTURES) or the day (GAZETTA_DAY).");

  const [snapshot, info, season] = await Promise.all([
    getFootballSnapshot(gameweek),
    fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo),
    fetchFixtures().then(mapFixtures),
  ]);
  const round = periodGameweeks(info.scoringPeriods, datedKickoffs(season)).find((p) => p.gameweeks.includes(gameweek));
  if (round === undefined) throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  say(`League ${FANTRAX_LEAGUE_ID}, gameweek ${gameweek}, period ${round.period} (gameweeks ${round.gameweeks.join(", ")}).`);
  const facts = await gatherRoundFacts(info, snapshot, round.period);

  const input = await matchdayInput({
    snapshot,
    facts,
    periodGameweeks: round.gameweeks,
    pick: (f) => (ids.length > 0 ? ids.includes(f.id) : londonDayOf(f.kickoff ?? "") === day),
    say,
  });
  if (input === null || input.matches.length === 0) return say("Nothing to report for that choice.");
  const desks = deskDay(input);
  const brief = buildReportsBrief(input.day, gameweek, desks);

  if (process.env.DRY_RUN === "1") {
    say(`\n${brief}`);
    for (const desk of desks) say(`\nKEY STATS, ${desk.match.home.name} v ${desk.match.away.name}:\n${desk.keyStats.map((k) => `- ${k.text}`).join("\n")}`);
    return;
  }
  say("Writing is not wired yet; run with DRY_RUN=1.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
