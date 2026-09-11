import type {
  IntelMatch,
  IntelMatches,
  IntelPlayer,
  IntelSetPieces,
  IntelSquads,
  IntelShots,
  IntelTouches,
  IntelXi,
  Shot,
  TouchPlayer,
} from "@epl/core";
import { matchIntel, shotIntel, squadIntel, touchIntel } from "@epl/core";
import squadsFile from "../../../data/intel/squads/26-27.json";
import xiFile from "../../../data/intel/xi/gw3.json";
import piecesFile from "../../../data/intel/set-pieces/26-27.json";
import matchesFile from "../../../data/intel/matches/26-27.json";
import touchesFile from "../../../data/intel/touches/26-27.json";
import shotsFile from "../../../data/intel/shots/26-27.json";

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

/** Every match the sister repo has logged, by FPL's fixture id.
 *
 *  **Not per round, unlike the eleven.** An XI is for one gameweek and names it
 *  in its filename; a match log accumulates all season, so this is one file that
 *  grows and the question a screen asks is per FIXTURE — `matchIntel` returns a
 *  Map and a miss is the ordinary answer. 20 of 380 on 4 Sep 2026, running about
 *  a day behind full time. */
export const intelMatches: Map<number, IntelMatch> = matchIntel(
  matchesFile as unknown as IntelMatches,
);

/** Where each man played, by FPL code, as the touches themselves.
 *
 *  **The one export that is data rather than description**, and it is why
 *  `write()` in the sister's exporter grew a `dense` flag: 45,244 bare integers
 *  at one-per-line is nine times the size, all of it whitespace, in a directory
 *  every byte of which is baked into this bundle.
 *
 *  A miss is the ordinary answer and there are two reasons for one — a man the
 *  SofaScore bridge has not settled (22 player-matches on 10 Sep 2026), and a
 *  man who has not played. The screen says the same thing either way, because
 *  from a reader's side they are the same fact: there is no map to draw. */
export const intelTouches: Map<number, TouchPlayer> = touchIntel(
  touchesFile as unknown as IntelTouches,
);

/** Every man's shots, by FPL code, already on the touch clouds' convention.
 *
 *  SofaScore publishes a shot as distance from the attacking goal and a touch
 *  the other way round; the exporter flips one so the app learns one convention
 *  rather than two. 824 shots by 248 players on 10 Sep 2026. */
export const intelShots: Map<number, Shot[]> = shotIntel(shotsFile as unknown as IntelShots);
