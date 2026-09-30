import {
  DRAFT_DESK,
  FANTRAX_LEAGUE_ID,
  categoryPoints,
  datedKickoffs,
  debuts,
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
  londonWeekdayLong,
  mapBenchOrder,
  mapFixtures,
  mapLeagueInfo,
  mapLiveScores,
  mapSeasonResults,
  matchupState,
  oldBoys,
  periodGameweeks,
  priceOf,
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
import { appearance, categoryIds, matchReads, mostPaid, startedOf, tallies, timeOf } from "./draftReads";
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

  const rules = info.scoring;
  const flat = (category: string, slot: string) => (rules === null ? 0 : (categoryPoints(rules, category, slot) ?? 0));
  const ids = categoryIds(info);
  const keeper = rules?.goaliePosition ?? null;
  // A return is a goal, an assist or a clean sheet; a keeper's is a clean sheet (Craig, 29 Sep 2026).
  const slotOf = new Map(facts.teams.flatMap((t) => { const s = sheetOf(t); return [...s.starters, ...s.bench].map((m) => [m.fantraxId, m.slot] as const); }));
  const worth = {
    keeper,
    appearance: appearance(reads.map((r) => r.raw), ids.minutes),
    // The most a defensive bonus, or a keeper's saves, paid in a match this gameweek: the ceiling before "cannot catch".
    bonus: Object.fromEntries(SLOTS.map((slot) => [slot, mostPaid(reads.map((r) => r.raw), slot === keeper ? ids.saves : ids.defence, slot, slotOf)])),
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
  let rankAfter = new Map<string, number>();
  // Only a report that is due: a cut-off whose matches are all settled. An unplayed gameweek would read as nought-nought.
  const due = new Set(draftReportsDue(schedule, gameweek).map((d) => d.cutoff));
  for (const [cutoff, last] of ([["saturday", saturday], ["gameweek", days.at(-1)!]] as const).filter(([c]) => due.has(c))) {
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
      // A clean sheet counts where it is worth telling; a midfielder's single point is not.
      const paidClean = priceOf(worth, m.slot, "clean sheet") >= DRAFT_DESK.cleanSheetStory;
      const appeared = (got?.minutes ?? 0) > 0;
      const theirGoals = done.flatMap((f) => goals.get(f.code) ?? []);
      return {
        fantraxId: m.fantraxId,
        code: m.player.code,
        clubCode: clubs.get(club)?.code ?? 0,
        clubId: club,
        name: m.player.name,
        club: clubs.get(club)?.name ?? "?",
        slot: m.slot,
        points: got?.points ?? null,
        minutes: got?.minutes ?? 0,
        played: done.length,
        left: games.length - done.length,
        debut: (debuts(sheet, history.get(sheet.teamId) ?? []) ?? []).some((d) => d.fantraxId === m.fantraxId),
        projected: projections.get(m.player.code)?.gameweeks.find((g) => g.gw === gameweek)?.points ?? null,
        next: opponent === undefined || coming === undefined ? null : { opponent: opponent.name, home, day: londonWeekdayLong(coming.kickoff!) },
        started: appeared ? startedOf(m.player.code, done.map((f) => f.code), starters) : null,
        matches: games.map((f) => ({ code: f.code, label: `${clubs.get(f.homeClubId)?.name ?? "?"} v ${clubs.get(f.awayClubId)?.name ?? "?"}` })),
        // Fitness from Fantrax's own news arrives with the writer; until then no man carries any.
        fitness: null,
        goals: got?.goals ?? 0,
        assists: got?.assists ?? 0,
        cleanSheets: paidClean ? (got?.cleanSheets ?? 0) : 0,
        scoredAt: theirGoals.filter((g) => !g.own && g.scorer === m.player.code).map(timeOf),
        // The first goal his club let in, in each match he played: the one that took a clean sheet.
        concededFirstAt: appeared && paidClean ? done.flatMap((f) => (goals.get(f.code) ?? []).filter((g) => g.clubId !== club).slice(0, 1).map(timeOf)) : [],
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
