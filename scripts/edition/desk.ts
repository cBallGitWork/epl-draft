import {
  draftReportsDue,
  firstKickoff,
  locksAt,
  openingGameweek,
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
import type { DeskFacts } from "./facts";

// What state the desk is in, as one answer.
//
// Lifted out of `write-edition.ts` when that file crossed §4's hard ceiling a
// second time. It is a seam rather than a line count: this says what is TRUE of
// the round right now, while the file it left runs a firing — reads the ledger,
// asks the newsdesk, spends the cap, persists.

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
    pressers: input.lines.length > 0,
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
  const roster = info.rosterPeriods.find((each) => each.number === period);
  const kickoff = roster === undefined ? null : firstKickoff(roster, kickoffs);
  const lock = kickoff === null ? null : locksAt(kickoff);
  const gameweek = openingGameweek(calendar, period);
  return lock !== null && gameweek !== undefined ? { period, gameweek, locksAt: lock } : null;
}
