import type { FootballSnapshot } from "@epl/core";
import type { SubMark } from "../components/football/SubMarker";
import { matchManEvents } from "../matchDetail";
import { kickedOffFixtures, subMarksByCode, type PickFixtures } from "./subs";

/** Who came on or went off in his real match this round, by FPL code, off the cached match detail reads. */
export async function squadSubs(
  men: readonly PickFixtures[],
  snapshot: FootballSnapshot,
): Promise<Record<number, SubMark>> {
  const events = new Map(
    await Promise.all(
      kickedOffFixtures(men).map(
        async (code) => [code, await matchManEvents(snapshot.gameweek, code, snapshot.players)] as const,
      ),
    ),
  );
  return subMarksByCode(men, events);
}
