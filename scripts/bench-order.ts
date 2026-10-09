import {
  FANTRAX_LEAGUE_ID,
  datedKickoffs,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLineupState,
  mapFixtures,
  mapLeagueInfo,
  periodLock,
  planningPeriod,
  readBenchAnswer,
  requireLeague,
  sendBenchOrder,
} from "@epl/core";
import { setTimeout as sleep } from "node:timers/promises";
import { benchOrderRun } from "./benchOrder/run";

// The deadline's bench order (Craig, 9 Oct 2026): five minutes before the lock, every bench its manager left unnumbered
// is numbered by total points with the commissioner's session. A dry run unless --write; --wait --within <minutes>
// sleeps until the moment when the lock is that close. `.github/workflows/bench-order.yml` runs it every hour.
// By hand: --team <fantraxTeamId> for one team, --now to write before the last minutes (never after the lock).

async function calendar() {
  const [info, fixtures] = await Promise.all([fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo), fetchFixtures().then(mapFixtures)]);
  const kickoffs = datedKickoffs(fixtures);
  return { info, kickoffs, lockOf: (period: number) => periodLock(info.rosterPeriods.find((p) => p.number === period), kickoffs) };
}

/** `--team <id>`'s id, or undefined. */
function flagValue(flag: string): string | undefined {
  const at = process.argv.indexOf(flag);
  if (at < 0) return undefined;
  const value = process.argv[at + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${flag} needs a value`);
  return value;
}

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const write = process.argv.includes("--write");
  const session = process.env.FANTRAX_COOKIE || undefined;
  const wait = process.argv.includes("--wait");
  // Without a window a run never waits, so any lock ahead is its to write in the last minutes.
  const within = Number(flagValue("--within") ?? Infinity);
  if (!(within > 0)) throw new Error("--within needs a number of minutes");
  if (wait && within === Infinity) throw new Error("--wait needs --within <minutes>");
  if (write && session === undefined) throw new Error("FANTRAX_COOKIE is not set: --write needs the commissioner's session");

  const first = await calendar();
  process.exitCode = await benchOrderRun(
    {
      now: () => Date.now(),
      sleep: (ms) => sleep(ms),
      next: async () => {
        const period = planningPeriod(first.info.rosterPeriods, first.kickoffs, new Date().toISOString());
        return period === null ? null : { period, lock: first.lockOf(period) };
      },
      lockOf: async (period) => (await calendar()).lockOf(period),
      teams: async () => first.info.teams.map((t) => ({ teamId: t.teamId, name: t.name })),
      roster: (teamId, period) => fetchLineupState(FANTRAX_LEAGUE_ID, teamId, period, session),
      write: async (teamId, period, order) =>
        readBenchAnswer(await sendBenchOrder(FANTRAX_LEAGUE_ID, { teamId, period, order }, session ?? "")),
      log: (line) => console.log(line),
    },
    { write, wait, within, early: process.argv.includes("--now"), team: flagValue("--team") },
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
