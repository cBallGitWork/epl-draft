import {
  draftReportsDue,
  reportDays,
  roundSlot,
  tieState,
  type DeskState,
  type FootballSnapshot,
  type PresserLine,
} from "@epl/core";
import { presserDays } from "./presserWeek";
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
}): DeskState {
  const { snapshot, facts } = input;
  return {
    gameweek: snapshot.gameweek,
    period: input.period,
    finished: input.finished,
    locked: input.locked,
    pressers: presserDays(input.lines, snapshot.gameweek),
    lineups:
      input.xiGameweek === null
        ? null
        : roundSlot("predicted-xi", input.xiGameweek),
    ahead: input.ahead,
    next: input.next,
    reportDays: reportDays(snapshot.fixtures, snapshot.gameweek),
    draftReports: draftReportsDue(snapshot.fixtures, snapshot.gameweek),
    ties: facts.pairings.map((pairing) => ({
      homeTeamId: pairing.home.teamId,
      awayTeamId: pairing.away.teamId,
      state: tieState(facts.scores.get(pairing.home.teamId), facts.scores.get(pairing.away.teamId)),
    })),
  };
}
