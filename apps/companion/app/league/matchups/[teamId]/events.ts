import type { FootballSnapshot, LineupDetail, PlManMatch } from "@epl/core";
import { matchManEvents } from "../../../matchDetail";
import { everyone, fixturesOf } from "./subs";

/** What each man did in every kicked-off fixture the sheets on screen play in, by FPL fixture code.
 *  Asked only of sheets the gate has opened, so a hidden eleven leaks nothing through its subs. */
export async function sheetEvents(
  sheets: Iterable<LineupDetail>,
  snapshot: FootballSnapshot,
): Promise<Map<number, Map<number, PlManMatch>>> {
  const codes = fixturesOf([...sheets].flatMap(everyone));
  return new Map(
    await Promise.all(
      codes.map(async (code) => [code, await matchManEvents(snapshot.gameweek, code, snapshot.players)] as const),
    ),
  );
}
