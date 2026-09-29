import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  categoryPoints,
  datedKickoffs,
  debuts,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLiveScoringDay,
  fetchTeamRosterInfo,
  getFootballSnapshot,
  londonDayOf,
  mapBenchOrder,
  mapBenchPlayerPoints,
  mapFixtures,
  mapLeagueInfo,
  mapLivePlayerPoints,
  mapLiveScores,
  matchupState,
  periodGameweeks,
  requireLeague,
  sheetOf,
  type DraftMan,
  type DraftSide,
  type LivePlayerPoints,
  type Sheet,
  type SheetMan,
} from "@epl/core";
import { gatherRoundFacts } from "./edition/facts";
import { earlierSheets } from "./edition/sheets";
import { LEAGUE_LIMITS } from "./paths";

// The draft match-up desk's facts for one gameweek at two cut-offs, after Saturday's games and at the end of the week,
// printed and never written up: `GAZETTA_GAMEWEEK=5 npm run draft:proof`. Every read is public; no model is called.

const say = (line: string) => process.stdout.write(`${line}\n`);

/** Position minimums from the file `npm run roster-limits` writes, since no Fantrax endpoint carries them. */
function minimums(): Record<string, number> | null {
  const file = JSON.parse(readFileSync(join(LEAGUE_LIMITS, "roster-limits.json"), "utf8")) as {
    leagues: Record<string, { minimumsInForce?: boolean; positions?: { shortName: string; minActive: number }[] }>;
  };
  const league = file.leagues[FANTRAX_LEAGUE_ID];
  if (league?.minimumsInForce !== true || league.positions === undefined) return null;
  return Object.fromEntries(league.positions.map((p) => [p.shortName, p.minActive]));
}

async function main(): Promise<void> {
  requireLeague(FANTRAX_LEAGUE_ID);
  const gameweek = Number(process.env.GAZETTA_GAMEWEEK);
  if (!Number.isInteger(gameweek)) throw new Error("GAZETTA_GAMEWEEK names the gameweek to read.");
  const [snapshot, info, season] = await Promise.all([getFootballSnapshot(gameweek), fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo), fetchFixtures().then(mapFixtures)]);
  const round = periodGameweeks(info.scoringPeriods, datedKickoffs(season)).find((p) => p.gameweeks.includes(gameweek));
  if (round === undefined) throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  const facts = await gatherRoundFacts(info, snapshot, round.period);
  const history = await earlierSheets(info, snapshot, round.period);

  // The London days the gameweek is played on; Saturday's cut-off is the end of its Saturday.
  const fixtures = season.filter((f) => f.gameweek === gameweek && f.kickoff !== null);
  const days = [...new Set(fixtures.map((f) => londonDayOf(f.kickoff!)!))].sort();
  const saturday = days.find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6) ?? days[0];
  const reads = await Promise.all(days.map(async (date) => ({ date, raw: await fetchLiveScoringDay(FANTRAX_LEAGUE_ID, round.period, date) })));
  const orders = new Map(await Promise.all(facts.teams.map(async (t) => [t.teamId, mapBenchOrder(await fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, t.teamId, round.period))] as const)));

  const rules = info.scoring;
  const minutesCategories = new Set(Object.entries(info.scoringCategories).filter(([, c]) => c.code === "Min").map(([id]) => id));
  const slots = ["G", "D", "M", "F"];
  const worth = {
    goal: Object.fromEntries(slots.map((s) => [s, rules === null ? 0 : (categoryPoints(rules, "G", s) ?? 0)])),
    cleanSheet: Object.fromEntries(slots.map((s) => [s, rules === null ? 0 : (categoryPoints(rules, "CS", s) ?? 0)])),
  };
  const min = minimums();
  const limits = { min: min ?? {}, max: info.roster.maxActiveByPosition };
  say(`League ${FANTRAX_LEAGUE_ID}, period ${round.period}, gameweek ${gameweek}; played on ${days.join(", ")}.`);
  say(`A goal is worth ${JSON.stringify(worth.goal)}; a clean sheet ${JSON.stringify(worth.cleanSheet)}.`);
  say(`Eleven limits: most ${JSON.stringify(limits.max)}; fewest ${min === null ? "not recorded for this league" : JSON.stringify(min)}.`);

  for (const [label, last] of [["AFTER SATURDAY", saturday], ["END OF THE WEEK", days.at(-1)!]] as const) {
    const upTo = reads.filter((r) => r.date <= last);
    const byMan = new Map<string, { points: number; minutes: number }>();
    for (const { raw } of upTo) {
      for (const squad of [...mapLivePlayerPoints(raw), ...mapBenchPlayerPoints(raw)]) {
        for (const p of squad.players) {
          const was = byMan.get(p.fantraxId) ?? { points: 0, minutes: 0 };
          byMan.set(p.fantraxId, { points: was.points + p.points, minutes: was.minutes + minutesOf(p, minutesCategories) });
        }
      }
    }
    const totals = new Map<string, number>();
    for (const { raw } of upTo) for (const s of mapLiveScores(raw)) totals.set(s.teamId, (totals.get(s.teamId) ?? 0) + (s.points ?? 0));
    const clubGames = (clubId: number) => fixtures.filter((f) => f.homeClubId === clubId || f.awayClubId === clubId);
    const draftMan = (sheetMan: SheetMan, sheet: Sheet): DraftMan => {
      const games = clubGames(sheetMan.player.clubId);
      const done = games.filter((f) => londonDayOf(f.kickoff!)! <= last).length;
      const got = byMan.get(sheetMan.fantraxId);
      const first = debuts(sheet, history.get(sheet.teamId) ?? []) ?? [];
      return {
        fantraxId: sheetMan.fantraxId,
        name: sheetMan.player.name,
        club: snapshot.clubs.find((c) => c.id === sheetMan.player.clubId)?.shortName ?? "?",
        slot: sheetMan.slot,
        points: got?.points ?? null,
        minutes: got?.minutes ?? 0,
        played: done,
        left: games.length - done,
        debut: first.some((m) => m.fantraxId === sheetMan.fantraxId),
      };
    };
    const side = (teamId: string): DraftSide | null => {
      const team = facts.teams.find((t) => t.teamId === teamId);
      if (team === undefined) return null;
      const sheet = sheetOf(team);
      const order = orders.get(teamId)?.order ?? [];
      const rank = (m: SheetMan) => (order.includes(m.fantraxId) ? order.indexOf(m.fantraxId) : order.length);
      return {
        teamId,
        name: team.teamName,
        total: totals.get(teamId) ?? null,
        eleven: sheet.starters.map((m) => draftMan(m, sheet)),
        bench: [...sheet.bench].sort((a, b) => rank(a) - rank(b)).map((m) => draftMan(m, sheet)),
        benchNumbered: orders.get(teamId)?.numbered ?? false,
      };
    };
    say(`\n===== ${label} (to ${last}) =====`);
    for (const pairing of facts.pairings) {
      const home = side(pairing.home.teamId);
      const away = side(pairing.away.teamId);
      if (home === null || away === null) continue;
      say(`\n${home.name} v ${away.name}${home.benchNumbered && away.benchNumbered ? "" : " (a bench not numbered by its manager: the page's order)"}`);
      for (const line of matchupState({ home, away }, worth, limits).lines) say(`- ${line}`);
    }
  }
  say("\nTHE TABLE before the week:");
  for (const row of facts.table) say(`- ${row.rank}. ${row.teamName}: ${row.won}-${row.drawn}-${row.lost}, ${row.points} points`);
}

/** His minutes from Fantrax's own minutes category, which every man who played carries. */
function minutesOf(p: LivePlayerPoints, categories: ReadonlySet<string>): number {
  const row = p.counts.find((c) => categories.has(c.category));
  return row?.value === null || row === undefined ? 0 : Number(row.value) || 0;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
