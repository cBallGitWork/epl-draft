import type { IntelPlayer, IntelSetPieces, IntelSquads, IntelXi } from "@epl/core";
import { squadIntel } from "@epl/core";
import squadsFile from "../../../data/intel/squads/26-27.json";
import xiFile from "../../../data/intel/xi/gw3.json";
import piecesFile from "../../../data/intel/set-pieces/26-27.json";

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
// round, and the export names the round it fetched.
//
// **What the round has to be checked AGAINST is the fixture, not the file.**
// This paragraph used to end by saying a build shipping last week's file "should
// be visibly wrong rather than silently serving it", and that was a property the
// code did not have — nothing compared the two numbers, so with `gw3.json` still
// on disk a build made after the round turned drew last week's eleven under a
// heading naming this week's opponent, with eleven real names and a real
// formation and nothing on screen out of place. `xiFault` could not catch it:
// the file is a perfectly good eleven, it is only the wrong one. `xiRoundFault`
// is the check that was missing, `/prem/club/[code]` is where it is applied, and
// the board says which two rounds disagree rather than quietly going away.
// `npm run intel-check` says the same thing at the command line.

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

/** Who takes each club's set pieces, by FPL club code. */
export const intelSetPieces = piecesFile as unknown as IntelSetPieces;

/** One club's line for a man, for arranging a pitch.
 *
 *  Null where the export could not settle a real position — which is 146 of 651
 *  men, and deliberate: those came from FPL's own fantasy classification, and
 *  the football layer refuses it. */
export function intelLine(code: number): string | null {
  return intelSquads.get(code)?.line ?? null;
}
