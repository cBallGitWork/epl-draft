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
// is numbered by total points with the commissioner's session. A dry run unless --write; --wait sleeps until the moment
// when the lock is before tomorrow's 08:00. `scripts/bench-order.sh` runs it from launchd every morning.

async function calendar() {
  const [info, fixtures] = await Promise.all([fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo), fetchFixtures().then(mapFixtures)]);
  return { info, kickoffs: datedKickoffs(fixtures) };
}

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const write = process.argv.includes("--write");
  const session = process.env.FANTRAX_COOKIE || undefined;
  if (write && session === undefined) throw new Error("FANTRAX_COOKIE is not set: --write needs the commissioner's session");

  const first = await calendar();
  process.exitCode = await benchOrderRun(
    {
      now: () => Date.now(),
      sleep: (ms) => sleep(ms),
      next: async () => {
        const period = planningPeriod(first.info.rosterPeriods, first.kickoffs, new Date().toISOString());
        const found = first.info.rosterPeriods.find((p) => p.number === period);
        return period === null ? null : { period, lock: periodLock(found, first.kickoffs) };
      },
      lockOf: async (period) => {
        const { info, kickoffs } = await calendar();
        return periodLock(info.rosterPeriods.find((p) => p.number === period), kickoffs);
      },
      teams: async () => first.info.teams.map((t) => ({ teamId: t.teamId, name: t.name })),
      roster: (teamId, period) => fetchLineupState(FANTRAX_LEAGUE_ID, teamId, period, session),
      write: async (teamId, period, order) =>
        readBenchAnswer(await sendBenchOrder(FANTRAX_LEAGUE_ID, { teamId, period, order }, session ?? "")),
      log: (line) => console.log(line),
    },
    { write, wait: process.argv.includes("--wait") },
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
