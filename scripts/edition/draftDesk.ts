import {
  FANTRAX_LEAGUE_ID,
  datedKickoffs,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLiveScoringDay,
  fetchSeasonResults,
  fetchTeamRosterInfo,
  draftReportsDue,
  isSaturday,
  leadFirst,
  getFootballSnapshot,
  londonDayOf,
  mapBenchOrder,
  mapFixtures,
  mapLeagueInfo,
  mapLiveScores,
  mapSeasonResults,
  matchupState,
  oldBoys,
  periodGameweeks,
  projectionIntel,
  sheetOf,
  type Cutoff,
  type DraftMan,
  type DraftSide,
  type IntelProjections,
  type MatchupContext,
  type Sheet,
  type SheetMan,
} from "@epl/core";
import { INTEL_SEASON, readIntel } from "../intel";
import { gatherRoundFacts } from "./facts";
import { categoryIds, matchReads, slotWorth, tallies } from "./draftReads";
import { draftManOf, type ManReads } from "./draftMen";
import { draftSeason, gameweekFacts, meetingsOf, placeOf, ranksAfter } from "./draftSeason";
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
  /** Each due cut-off's match-ups, the lead first. */
  cutoffs: Map<Cutoff, MatchupContext[]>;
  /** Each side's place once the gameweek is added, for the form strip; empty until the gameweek is done. */
  rankAfter: Map<string, number>;
  notes: string[];
}

const SLOTS = ["G", "D", "M", "F"];

export async function draftDesk(gameweek: number): Promise<DraftDesk> {
  const [snapshot, info, schedule] = await Promise.all([getFootballSnapshot(gameweek), fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo), fetchFixtures().then(mapFixtures)]);
  const covering = periodGameweeks(info.scoringPeriods, datedKickoffs(schedule)).find((p) => p.gameweeks.includes(gameweek));
  if (covering === undefined) throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  const period = covering.period;
  const [facts, history, rawResults] = await Promise.all([gatherRoundFacts(info, snapshot, period), earlierSheets(info, snapshot, period), fetchSeasonResults(FANTRAX_LEAGUE_ID).catch(() => null)]);
  const results = rawResults === null ? [] : mapSeasonResults(rawResults);
  const season = await draftSeason(info, facts.table, results, facts.pedigree, period);

  const fixtures = schedule.filter((f) => f.gameweek === gameweek && f.kickoff !== null);
  const days = [...new Set(fixtures.map((f) => londonDayOf(f.kickoff!)!))].sort();
  const saturday = days.find(isSaturday) ?? days[0];
  const reads = await Promise.all(days.map(async (date) => ({ date, raw: await fetchLiveScoringDay(FANTRAX_LEAGUE_ID, period, date) })));
  const orders = new Map(await Promise.all(facts.teams.map(async (t) => [t.teamId, mapBenchOrder(await fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, t.teamId, period))] as const)));
  const { goals, starters } = await matchReads(gameweek, fixtures, snapshot.players);

  const ids = categoryIds(info);
  const worth = slotWorth(info, reads.map((r) => r.raw), facts.teams, SLOTS);
  const min = minimums(FANTRAX_LEAGUE_ID);
  const limits = { min: min ?? {}, max: info.roster.maxActiveByPosition };
  const projections = projectionIntel(readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`));
  const clubs = new Map(snapshot.clubs.map((c) => [c.id, c]));

  const cutoffs = new Map<Cutoff, MatchupContext[]>();
  let rankAfter = new Map<string, number>();
  // Only a report that is due: a cut-off whose matches are all settled. An unplayed gameweek would read as nought-nought.
  const due = new Set(draftReportsDue(schedule, gameweek).map((d) => d.cutoff));
  for (const [cutoff, last] of ([["saturday", saturday], ["gameweek", days.at(-1)!]] as const).filter(([c]) => due.has(c))) {
    const upTo = reads.filter((r) => r.date <= last).map((r) => r.raw);
    const byMan = tallies(upTo, ids);
    const totals = new Map<string, number>();
    for (const raw of upTo) for (const s of mapLiveScores(raw)) totals.set(s.teamId, (totals.get(s.teamId) ?? 0) + (s.points ?? 0));

    const reads_: ManReads = { gameweek, last, fixtures, clubs, byMan, worth, goals, starters, history, projections };
    const draftMan = (m: SheetMan, sheet: Sheet): DraftMan => draftManOf(m, sheet, reads_);
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
    // Every match-up first: the gameweek's form and table facts need all of their results at once.
    const states = facts.pairings.flatMap((pairing) => {
      const [home, away] = [side(pairing.home.teamId), side(pairing.away.teamId)];
      return home === null || away === null ? [] : [matchupState({ home, away }, worth, limits, cutoff)];
    });
    const formFacts = gameweekFacts(season, states, cutoff);
    if (cutoff === "gameweek") rankAfter = ranksAfter(season, states);
    const boys = (men: DraftSide, them: DraftSide) => oldBoys(men.eleven, { teamId: them.teamId, name: them.name }, season.formerly);
    cutoffs.set(
      cutoff,
      leadFirst(states.map((state) => ({
        state,
        places: { home: placeOf(season, state.home.side.teamId), away: placeOf(season, state.away.side.teamId) },
        meetings: meetingsOf(season, state.home.side, state.away.side),
        form: [...(formFacts.get(state.home.side.teamId) ?? []), ...(formFacts.get(state.away.side.teamId) ?? [])],
        oldBoys: [...boys(state.home.side, state.away.side), ...boys(state.away.side, state.home.side)],
      })), cutoff),
    );
  }
  const notes = [
    `Returns by slot: ${SLOTS.map((s) => `${s} ${worth.returns[s].map((w) => `${w.kind} ${w.worth}`).join(", ")}`).join("; ")}; a full match's minutes ${worth.appearance}.`,
    `Eleven limits: most ${JSON.stringify(limits.max)}; fewest ${min === null ? "not recorded for this league" : JSON.stringify(min)}.`,
    `Bench orders: ${[...orders.values()].filter((o) => o.by === "manager").length} of ${orders.size} set by the manager, the rest by total points.`,
    `Goal times read for ${goals.size} of ${fixtures.length} matches.`,
    `Due: ${due.size === 0 ? "nothing yet; the gameweek's matches are not settled" : [...due].join(" and ")}.`,
  ];
  return { gameweek, period, days, cutoffs, rankAfter, notes };
}
