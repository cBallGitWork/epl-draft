import { type LineupDetail, type PlManMatch, type SquadPlayerDetail, isResolved } from "@epl/core";
import type { SubMark } from "../../../components/football/SubMarker";

/** A sheet's eleven and bench as one list. */
export function everyone(sheet: LineupDetail): SquadPlayerDetail[] {
  return [...sheet.rows.flatMap((line) => line.players), ...sheet.bench];
}

/** The FPL fixture codes a squad's men have played in or are playing in; nobody has events before kickoff. */
export function fixturesOf(players: readonly SquadPlayerDetail[]): number[] {
  const codes = new Set<number>();
  for (const player of players) {
    for (const { fixture } of player.opposition ?? []) {
      if (fixture.status !== "upcoming") codes.add(fixture.code);
    }
  }
  return [...codes];
}

/** Each man's mark by `fantraxId`: coming on beats going off, as the match pitch draws it, and a later
 *  fixture beats an earlier one on a double. A man who played the whole match, or none of it, has none. */
export function subMarks(
  players: readonly SquadPlayerDetail[],
  events: ReadonlyMap<number, ReadonlyMap<number, PlManMatch>>,
): Record<string, SubMark> {
  const marks: Record<string, SubMark> = {};
  for (const { rostered, opposition } of players) {
    if (!isResolved(rostered)) continue;
    for (const { fixture } of opposition ?? []) {
      const did = events.get(fixture.code)?.get(rostered.player.code);
      if (did?.onAt != null) marks[rostered.slot.fantraxId] = { minute: did.onAt, off: false };
      else if (did?.offAt != null) marks[rostered.slot.fantraxId] = { minute: did.offAt, off: true };
    }
  }
  return marks;
}
