import type { MatchSheetLine, PlManMatch, PlSquadMan, PlTeamSheet } from "@epl/core";
import type { Match } from "./match";

// The team sheet's join: each man the Premier League named, his events, and FPL's line for him.

/** FPL's side of a man, found by the `code` the team sheet carries.
 *
 *  Built once for the whole board rather than looked up per row, and kept out of
 *  `Match` on purpose: that interface is the shared assembly four routes read,
 *  and two maps only this board wants do not belong in it. */
export interface Join {
  /** What FPL's own per-fixture sheet says he did — the chips are drawn from it.
   *  Undefined for a man who accrued nothing, which includes everyone who did
   *  not play. */
  line: (code: number | null) => MatchSheetLine | undefined;
  points: (code: number | null) => number;
}

export function joinOf(match: Pick<Match, "sheet" | "byCode" | "figures">): Join {
  const byId = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  const player = (code: number | null) => (code === null ? undefined : match.byCode.get(code));
  return {
    line: (code) => {
      const id = player(code)?.id;
      return id === undefined ? undefined : byId.get(id);
    },
    points: (code) => {
      const id = player(code)?.id;
      return id === undefined ? 0 : (match.figures.get(id)?.fplPoints ?? 0);
    },
  };
}

/** One man, joined across the two providers that describe him. */
export interface Named {
  man: PlSquadMan;
  /** His marks from the Premier League's events. Undefined for a man nothing
   *  happened to, which is most of them. */
  did: PlManMatch | undefined;
  /** Whether he was NAMED on the bench, whether or not he got on. CM greys the
   *  whole bench and so does this. */
  bench: boolean;
}

/** The eleven keeper-to-attack, then the bench keeper-to-attack.
 *
 *  **A man who came on is still a substitute** (Craig, 11 Sep 2026: *"players
 *  who started on the bench, stay on the bench in grey text, only first elevel
 *  in white, and stay in the same line up positions"*). This used to lift the
 *  men who got on out of the bench, sort them by the minute they arrived, and
 *  set them at full strength beside the starters — which answered "who played"
 *  and lost the thing a team sheet is for, which is who was NAMED and where. The
 *  bench now keeps its own order and its own ink, and what a substitute did is
 *  on his row: `on 79`, his marks, and his score.
 *
 *  **Both halves are sorted on the REAL-LIFE position** (Craig, 11 Sep 2026:
 *  *"original line up ordered by real life position xi / real life position sub
 *  in grey"*). The eleven used to take the FORMATION's order instead — the
 *  manager's drawn shape, keeper first — which is a better answer to "how did
 *  they line up" and a worse one to "who is this list". The shape is still on
 *  the row at the head of the panel, where it can be read in one glance rather
 *  than counted down eleven rows, and the two halves of the board now sort on
 *  the same principle. `sheet.shape` is no longer read here. */
export function ordered(sheet: PlTeamSheet, events: Map<number, PlManMatch>): Named[] {
  const did = (man: PlSquadMan) => (man.code === null ? undefined : events.get(man.code));
  const byPosition = (a: PlSquadMan, b: PlSquadMan) =>
    DOWN_THE_PITCH.indexOf(a.position ?? "") - DOWN_THE_PITCH.indexOf(b.position ?? "");

  return [
    ...[...sheet.lineup].sort(byPosition).map((man) => ({ man, did: did(man), bench: false })),
    ...[...sheet.substitutes].sort(byPosition).map((man) => ({ man, did: did(man), bench: true })),
  ];
}

/** Keeper to attack.
 *
 *  Craig, 11 Sep 2026: *"bench sorted by position too / use real life positions
 *  here"*, and then the same for the eleven.
 *
 *  A position this does not know sorts to the FRONT, which is `indexOf`'s -1 and
 *  is deliberate: a man the feed gave no position is one to look at, not one to
 *  bury at the bottom. It has not happened yet — 40 of 40 on the recorded
 *  fixture — so this is the behaviour on a case nobody has seen rather than a
 *  case anybody has. */
const DOWN_THE_PITCH = ["G", "D", "M", "F"];
