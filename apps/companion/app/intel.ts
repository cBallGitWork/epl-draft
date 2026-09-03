import type { IntelPlayer, IntelSquads, IntelXi } from "@epl/core";
import { squadIntel } from "@epl/core";
import squadsFile from "../../../data/intel/squads/26-27.json";
import xiFile from "../../../data/intel/xi/gw3.json";

// Where the app supplies the sister repo's export.
//
// It has to happen here rather than in core, for the reason `squads.ts` gives
// about the bridge: `packages/core/tsconfig.json` includes only `src/**/*.ts`,
// so core physically cannot read `data/`, and that compiler boundary is what
// keeps a file written by another repo at the edge where a person can see it.
//
// **A static import, and that is load-bearing.** It bakes the data into the
// build, which is what makes a committed export reach the app at all —
// `apps/companion/vercel.json` excludes `data/snapshots` and `data/probes` from
// the build trigger and `data/intel` is deliberately under neither, so a commit
// carrying a new export redeploys and a commit that does not build is data
// nobody reads (`scripts/paths.ts`, `EDITIONS_ROOT`).
//
// **The XI's round is in its filename and therefore in this import**, which is
// the one awkward part of the arrangement. A static import cannot take a
// variable, so the round is chosen at build time rather than at request time.
// That is correct rather than merely convenient: a predicted eleven is for one
// round, the export names the round it fetched, and a build that shipped last
// week's file should be visibly wrong rather than silently serving it under this
// week's heading. `npm run intel-check` is what says so out loud.

/** Every player the export carries, by FPL's season-stable code.
 *
 *  Asserted at the boundary rather than parsed, on `squads.ts:37`'s precedent:
 *  `resolveJsonModule` types the import as its literal contents, which is both
 *  too specific and not the shape core reasons about. The narrowing that matters
 *  — a row with no usable code, a position that must stay null — is `map.ts`'s
 *  and happens inside `squadIntel`. */
export const intelSquads: Map<number, IntelPlayer> = squadIntel(
  squadsFile as unknown as IntelSquads,
);

/** The predicted elevens, as the export left them. */
export const intelXi = xiFile as unknown as IntelXi;

/** One club's line for a man, for arranging a pitch.
 *
 *  Null where the export could not settle a real position — which is 146 of 651
 *  men, and deliberate: those came from FPL's own fantasy classification, and
 *  the football layer refuses it. */
export function intelLine(code: number): string | null {
  return intelSquads.get(code)?.line ?? null;
}
