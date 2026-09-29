import {
  FANTRAX_LEAGUE_ID,
  categoryPoints,
  datedKickoffs,
  debuts,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLiveScoringDay,
  fetchSeasonResults,
  fetchTeamRosterInfo,
  getFootballSnapshot,
  londonDayOf,
  mapBenchOrder,
  mapFixtures,
  mapLeagueInfo,
  mapLiveScores,
  mapSeasonResults,
  matchupState,
  periodGameweeks,
  periodPairings,
  projectionIntel,
  seasonForm,
  sheetOf,
  type Cutoff,
  type DraftMan,
  type DraftSide,
  type IntelProjections,
  type LeagueInfo,
  type MatchupContext,
  type PeriodResult,
  type Sheet,
  type SheetMan,
} from "@epl/core";
import { INTEL_SEASON, readIntel } from "../intel";
import { gatherRoundFacts } from "./facts";
import { appearance, categoryIds, goalsByFixture, mostPaid, tallies, timeOf } from "./draftReads";
import { minimums } from "./rosterMinimums";
import { earlierSheets } from "./sheets";

// The draft match-up desk's reads for one gameweek, turned into each match-up's facts at both cut-offs: points, minutes
// and returns by London day from Fantrax, the bench order, matches played and left and each goal's minute from the
// football layer, the table and runs, the last meeting, the next opponent, and a projection that
// orders and never prints.

export interface DraftDesk {
  gameweek: number;
  period: number;
  days: string[];
  cutoffs: Map<Cutoff, MatchupContext[]>;
  notes: string[];
}

const SLOTS = ["G", "D", "M", "F"];

export async function draftDesk(gameweek: number): Promise<DraftDesk> {
  const [snapshot, info, season] = await Promise.all([getFootballSnapshot(gameweek), fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo), fetchFixtures().then(mapFixtures)]);
  const round = periodGameweeks(info.scoringPeriods, datedKickoffs(season)).find((p) => p.gameweeks.includes(gameweek));
  if (round === undefined) throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  const period = round.period;
  const [facts, history, rawResults] = await Promise.all([gatherRoundFacts(info, snapshot, period), earlierSheets(info, snapshot, period), fetchSeasonResults(FANTRAX_LEAGUE_ID).catch(() => null)]);
  const results = rawResults === null ? [] : mapSeasonResults(rawResults);
  const form = seasonForm(facts.table, info.matchups, results);

  const fixtures = season.filter((f) => f.gameweek === gameweek && f.kickoff !== null);
  const days = [...new Set(fixtures.map((f) => londonDayOf(f.kickoff!)!))].sort();
  const saturday = days.find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6) ?? days[0];
  const reads = await Promise.all(days.map(async (date) => ({ date, raw: await fetchLiveScoringDay(FANTRAX_LEAGUE_ID, period, date) })));
  const orders = new Map(await Promise.all(facts.teams.map(async (t) => [t.teamId, mapBenchOrder(await fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, t.teamId, period))] as const)));
  const goals = await goalsByFixture(gameweek, fixtures, snapshot.players);

  const rules = info.scoring;
  const flat = (category: string, slot: string) => (rules === null ? 0 : (categoryPoints(rules, category, slot) ?? 0));
  const ids = categoryIds(info);
  const keeper = rules?.goaliePosition ?? null;
  // A return is a goal, an assist or a clean sheet; a keeper's is a clean sheet (Craig, 29 Sep 2026).
  const slotOf = new Map(facts.teams.flatMap((t) => { const s = sheetOf(t); return [...s.starters, ...s.bench].map((m) => [m.fantraxId, m.slot] as const); }));
  const worth = {
    appearance: appearance(reads.map((r) => r.raw), ids.minutes),
    // The most a defensive bonus, or a keeper's saves, paid in a match this round: the ceiling before "cannot catch".
    extra: Object.fromEntries(SLOTS.map((slot) => [slot, mostPaid(reads.map((r) => r.raw), slot === keeper ? ids.saves : ids.defence, slot, slotOf)])),
    returns: Object.fromEntries(
      SLOTS.map((slot) => [
        slot,
        (slot === keeper
          ? [{ kind: "clean sheet" as const, worth: flat("CS", slot) }]
          : [{ kind: "goal" as const, worth: flat("G", slot) }, { kind: "assist" as const, worth: flat("A", slot) }, { kind: "clean sheet" as const, worth: flat("CS", slot) }]
        ).filter((w) => w.worth > 0),
      ]),
    ),
  };
  const min = minimums(FANTRAX_LEAGUE_ID);
  const limits = { min: min ?? {}, max: info.roster.maxActiveByPosition };
  const projections = projectionIntel(readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`));
  const clubs = new Map(snapshot.clubs.map((c) => [c.id, c]));

  const cutoffs = new Map<Cutoff, MatchupContext[]>();
  for (const [cutoff, last] of [["saturday", saturday], ["week", days.at(-1)!]] as const) {
    const upTo = reads.filter((r) => r.date <= last).map((r) => r.raw);
    const byMan = tallies(upTo, ids);
    const totals = new Map<string, number>();
    for (const raw of upTo) for (const s of mapLiveScores(raw)) totals.set(s.teamId, (totals.get(s.teamId) ?? 0) + (s.points ?? 0));

    const draftMan = (m: SheetMan, sheet: Sheet): DraftMan => {
      const club = m.player.clubId;
      const games = fixtures.filter((f) => f.homeClubId === club || f.awayClubId === club);
      const done = games.filter((f) => londonDayOf(f.kickoff!)! <= last);
      const coming = games.find((f) => !done.includes(f));
      const home = coming?.homeClubId === club;
      const opponent = coming === undefined ? undefined : clubs.get(home ? coming.awayClubId : coming.homeClubId);
      const got = byMan.get(m.fantraxId);
      const paidClean = (worth.returns[m.slot] ?? []).some((w) => w.kind === "clean sheet");
      const played = (got?.minutes ?? 0) > 0;
      const theirGoals = done.flatMap((f) => goals.get(f.code) ?? []);
      return {
        fantraxId: m.fantraxId,
        name: m.player.name,
        club: clubs.get(club)?.name ?? "?",
        slot: m.slot,
        points: got?.points ?? null,
        minutes: got?.minutes ?? 0,
        played: done.length,
        left: games.length - done.length,
        debut: (debuts(sheet, history.get(sheet.teamId) ?? []) ?? []).some((d) => d.fantraxId === m.fantraxId),
        projected: projections.get(m.player.code)?.gameweeks.find((g) => g.gw === gameweek)?.points ?? null,
        next: opponent === undefined ? null : `${home ? "at home to" : "away to"} ${opponent.name}`,
        matches: games.map((f) => ({ code: f.code, label: `${clubs.get(f.homeClubId)?.name ?? "?"} v ${clubs.get(f.awayClubId)?.name ?? "?"}` })),
        // Fitness from Fantrax's own news arrives with the writer; until then no man carries any.
        fitness: null,
        goals: got?.goals ?? 0,
        assists: got?.assists ?? 0,
        cleanSheets: paidClean ? (got?.cleanSheets ?? 0) : 0,
        scoredAt: theirGoals.filter((g) => !g.own && g.scorer === m.player.code).map(timeOf),
        // The first goal his club let in, in each match he played: the one that took a clean sheet.
        concededFirstAt: played && paidClean ? done.flatMap((f) => (goals.get(f.code) ?? []).filter((g) => g.clubId !== club).slice(0, 1).map(timeOf)) : [],
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
        subOrder: order,
      };
    };
    const place = (teamId: string) => {
      const row = facts.table.find((r) => r.teamId === teamId);
      const run = form.find((f) => f.teamId === teamId)?.run ?? [];
      return row === undefined ? null : { rank: row.rank, won: row.won, drawn: row.drawn, lost: row.lost, run: run.map((g) => g.result).join("") };
    };
    const contexts: MatchupContext[] = [];
    for (const pairing of facts.pairings) {
      const home = side(pairing.home.teamId);
      const away = side(pairing.away.teamId);
      if (home === null || away === null) continue;
      contexts.push({
        state: matchupState({ home, away }, worth, limits, cutoff),
        places: { home: place(home.teamId), away: place(away.teamId) },
        lastMeeting: lastMeeting(info, results, period, home, away),
      });
    }
    cutoffs.set(cutoff, contexts);
  }
  const notes = [
    `Returns by slot: ${SLOTS.map((s) => `${s} ${worth.returns[s].map((w) => `${w.kind} ${w.worth}`).join(", ")}`).join("; ")}; a full match's minutes ${worth.appearance}.`,
    `Eleven limits: most ${JSON.stringify(limits.max)}; fewest ${min === null ? "not recorded for this league" : JSON.stringify(min)}.`,
    `Bench orders: ${[...orders.values()].filter((o) => o.by === "manager").length} of ${orders.size} set by the manager, the rest by total points.`,
    `Goal times read for ${goals.size} of ${fixtures.length} matches.`,
  ];
  return { gameweek, period, days, cutoffs, notes };
}

/** The two sides' most recent earlier meeting, in words. */
function lastMeeting(info: LeagueInfo, results: readonly PeriodResult[], period: number, home: DraftSide, away: DraftSide): string | null {
  const scored = (p: number, teamId: string) => results.find((r) => r.period === p && r.teamId === teamId)?.points ?? null;
  const pair = [home.teamId, away.teamId].sort().join();
  for (let p = period - 1; p >= 1; p--) {
    if (!periodPairings(info.matchups, info.teams, p).some((x) => [x.home.teamId, x.away.teamId].sort().join() === pair)) continue;
    const [h, a] = [scored(p, home.teamId), scored(p, away.teamId)];
    if (h === null || a === null) return null;
    return h === a ? `they drew ${h}-${a} in round ${p}` : `${h > a ? home.name : away.name} won ${Math.max(h, a)}-${Math.min(h, a)} in round ${p}`;
  }
  return null;
}
