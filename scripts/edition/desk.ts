import {
  draftReportsDue,
  openingGameweek,
  periodLock,
  reportDays,
  roundSlot,
  tieState,
  type DeskState,
  type FootballSnapshot,
  type GameweekKickoff,
  type LeagueInfo,
  type PeriodGameweeks,
  type PresserLine,
} from "@epl/core";
import { presserDays } from "./presserWeek";
import type { DeskFacts } from "./facts";

// What is true of the round right now, as one answer for the newsdesk.

export function deskState(input: {
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  period: number;
  finished: boolean;
  locked: boolean;
  lines: readonly PresserLine[];
  /** The round the predicted elevens are for, or null when we do not hold it. */
  xiGameweek: number | null;
  ahead: DeskState["ahead"];
  next: DeskState["next"];
  season: DeskState["season"];
}): DeskState {
  const { snapshot, facts } = input;
  return {
    gameweek: snapshot.gameweek,
    period: input.period,
    finished: input.finished,
    locked: input.locked,
    pressers: presserDays(input.lines),
    lineups:
      input.xiGameweek === null
        ? null
        : roundSlot("predicted-xi", input.xiGameweek),
    ahead: input.ahead,
    next: input.next,
    season: input.season,
    reportDays: reportDays(snapshot.fixtures, snapshot.gameweek),
    draftReports: draftReportsDue(snapshot.fixtures, snapshot.gameweek),
    ties: facts.pairings.map((pairing) => ({
      homeTeamId: pairing.home.teamId,
      awayTeamId: pairing.away.teamId,
      state: tieState(facts.scores.get(pairing.home.teamId), facts.scores.get(pairing.away.teamId)),
    })),
  };
}

/** The season's first head-to-head period, its gameweek and its lock, once the draft is complete; null before. */
export function seasonOpening(info: LeagueInfo, calendar: readonly PeriodGameweeks[], kickoffs: readonly GameweekKickoff[], drafted: boolean): DeskState["season"] {
  if (!drafted || info.matchups.length === 0) return null;
  const period = Math.min(...info.matchups.map((each) => each.period));
  const lock = periodLock(info.rosterPeriods.find((each) => each.number === period), kickoffs);
  const gameweek = openingGameweek(calendar, period);
  return lock !== null && gameweek !== undefined ? { period, gameweek, locksAt: lock } : null;
}
