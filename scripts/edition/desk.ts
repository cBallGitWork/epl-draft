import {
  fixtureStakes,
  roundSlot,
  tieState,
  type Club,
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

/** The slug a wire item files under, from its article URL. */
function newsSlug(key: string): string {
  const tail = key.split("/").filter(Boolean).pop() ?? key;
  return `news-${tail}`.slice(0, 80);
}

export function deskState(input: {
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  clubs: Map<number, Club>;
  period: number;
  finished: boolean;
  started: boolean;
  locked: boolean;
  lines: readonly PresserLine[];
  /** The round the predicted elevens are for, or null when we do not hold it. */
  xiGameweek: number | null;
  ahead: DeskState["ahead"];
  next: DeskState["next"];
}): DeskState {
  const { snapshot, facts, clubs } = input;
  return {
    gameweek: snapshot.gameweek,
    period: input.period,
    finished: input.finished,
    started: input.started,
    locked: input.locked,
    stakes: fixtureStakes(
      snapshot.fixtures.filter((fixture) => fixture.gameweek === snapshot.gameweek),
      facts.teams,
      facts.pairings,
      clubs,
    ),
    pressers: presserDays(input.lines, snapshot.gameweek),
    lineups:
      input.xiGameweek === null
        ? null
        : roundSlot("predicted-xi", input.xiGameweek),
    ahead: input.ahead,
    next: input.next,
    dealsInWindow: facts.business.length,
    news: facts.news.map((story) => ({ key: story.item.key, slug: newsSlug(story.item.key) })),
    ties: facts.pairings.map((pairing) => ({
      homeTeamId: pairing.home.teamId,
      awayTeamId: pairing.away.teamId,
      state: tieState(facts.scores.get(pairing.home.teamId), facts.scores.get(pairing.away.teamId)),
    })),
  };
}
