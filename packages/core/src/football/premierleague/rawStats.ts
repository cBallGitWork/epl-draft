// The `/stats/match/{id}` endpoint, mirrored as it actually answers.
//
// **Its own file because `raw.ts` reached the ceiling**, and this was the seam
// that cost nothing: these two types describe one endpoint, they are read by one
// mapper (`matchStats.ts`) and one client function, and nothing in the fixture
// family refers to them. CODE_RULES §4 says split at 300 rather than argue, and
// splitting a provider mirror by ENDPOINT keeps each file answering "what does
// this read give us".

import type { RawPlFixture } from "./raw";

/** One Opta metric, as `/stats/match`, `/stats/team` and `/stats/player` all give
 *  it.
 *
 *  **`description` is a placeholder in their own payload** — every one of the 212
 *  reads `"Todo: <name>"` — so it is mirrored here to describe reality and must
 *  never be printed.
 *
 *  **A metric whose value is nought is OMITTED, and that inverts a binding
 *  rule.** Counted over 40 team-sides of two completed rounds: shots, fouls,
 *  possession, passes, tackles and headers 40/40; corners 39; on target 37;
 *  yellow cards 36; offsides 27; **red cards 1** — and there was exactly one red
 *  card in those rounds. `DESIGN.md` §7's "Absence is `—`, never `0`" is about a
 *  figure a provider could not give us; this is a provider saying nought by
 *  saying nothing. A reader defaults a missing metric to 0 and says so. */
export interface RawPlMetric {
  name: string;
  value: number;
  description?: string;
}

/** `/stats/match/{id}` — every Opta metric for both sides of one match.
 *
 *  `data` is keyed by TEAM ID as a string, and each side's metrics are under `M`.
 *  Present on 21 of 21 played fixtures, ~170 metrics a side. */
export interface RawPlMatchStats {
  entity?: RawPlFixture;
  data: Record<string, { M: RawPlMetric[] }>;
}
