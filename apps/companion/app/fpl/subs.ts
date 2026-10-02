import type { Opposition, PlManMatch } from "@epl/core";
import type { SubMark } from "../components/football/SubMarker";

/** One of the fifteen as the sub marks need him: his FPL code and his club's fixtures this round. */
export interface PickFixtures {
  code: number;
  opposition: readonly Opposition[] | undefined;
}

/** The fixture codes these men have kicked off in, each once; nobody has events before kickoff. */
export function kickedOffFixtures(men: readonly PickFixtures[]): number[] {
  const codes = new Set<number>();
  for (const { opposition } of men) {
    for (const { fixture } of opposition ?? []) {
      if (fixture.status !== "upcoming") codes.add(fixture.code);
    }
  }
  return [...codes];
}

/** Each man's mark by FPL code: coming on beats going off, and a later fixture beats an earlier one
 *  on a double. A man who played the whole match, or none of it, has none. */
export function subMarksByCode(
  men: readonly PickFixtures[],
  events: ReadonlyMap<number, ReadonlyMap<number, PlManMatch>>,
): Record<number, SubMark> {
  const marks: Record<number, SubMark> = {};
  for (const { code, opposition } of men) {
    for (const { fixture } of opposition ?? []) {
      const did = events.get(fixture.code)?.get(code);
      if (did?.onAt != null) marks[code] = { minute: did.onAt, off: false };
      else if (did?.offAt != null) marks[code] = { minute: did.offAt, off: true };
    }
  }
  return marks;
}
