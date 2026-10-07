import type { MatchSheetLine, PlManMatch, PlSquadMan, PlTeamSheet } from "@epl/core";
import type { Match } from "./match";

// The team sheet's join: each man the Premier League named, his events, and FPL's line for him.

/** A map's entry for a sheet man; none for a man the bridge gave no FPL code. */
export function forCode<T>(map: ReadonlyMap<number, T>, code: number | null): T | undefined {
  return code === null ? undefined : map.get(code);
}

/** FPL's side of a man, found by the `code` the team sheet carries — built once per board, kept out of `Match`. */
export interface Join {
  /** FPL's per-fixture line for him, which the chips are drawn from; undefined for a man who accrued nothing. */
  line: (code: number | null) => MatchSheetLine | undefined;
  points: (code: number | null) => number;
}

export function joinOf(match: Pick<Match, "sheet" | "byCode" | "figures">): Join {
  const byId = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  const player = (code: number | null) => forCode(match.byCode, code);
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
  /** His Premier League events; undefined for a man nothing happened to, which is most of them. */
  did: PlManMatch | undefined;
  /** Whether he was NAMED on the bench, whether or not he got on. */
  bench: boolean;
}

/** Whether he came off the bench. */
export function cameOn(row: Named): boolean {
  return row.did?.onAt != null;
}

/** Whether he was on the pitch at all: named in the eleven, or on from the bench. */
export function appeared(row: Named): boolean {
  return !row.bench || cameOn(row);
}

/** The eleven keeper-to-attack, then the bench keeper-to-attack, each by the position he was named in.
 *  A man who came on stays on the bench, in its order (Craig, 11 Sep 2026). */
export function ordered(sheet: PlTeamSheet, events: Map<number, PlManMatch>): Named[] {
  const did = (man: PlSquadMan) => forCode(events, man.code);
  const byPosition = (a: PlSquadMan, b: PlSquadMan) =>
    DOWN_THE_PITCH.indexOf(a.position ?? "") - DOWN_THE_PITCH.indexOf(b.position ?? "");

  return [
    ...[...sheet.lineup].sort(byPosition).map((man) => ({ man, did: did(man), bench: false })),
    ...[...sheet.substitutes].sort(byPosition).map((man) => ({ man, did: did(man), bench: true })),
  ];
}

/** Keeper to attack. A position this does not know sorts first — a man with none is one to look at. */
const DOWN_THE_PITCH = ["G", "D", "M", "F"];
