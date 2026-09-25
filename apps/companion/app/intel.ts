import type {
  IntelCareers,
  IntelDepth,
  IntelMatch,
  IntelMatches,
  IntelPlayer,
  IntelProjections,
  IntelSetPieces,
  IntelSquads,
  IntelShots,
  IntelStrength,
  IntelTouches,
  IntelXi,
  ClubDepth,
  ClubStrength,
  ProjectedPlayer,
  Shot,
  TouchPlayer,
} from "@epl/core";
import { careerIntel, depthIntel, matchIntel, projectionIntel, shotIntel, squadIntel, strengthIntel, touchIntel } from "@epl/core";
import squadsFile from "../../../data/intel/squads/26-27.json";
import xiFile from "../../../data/intel/xi/26-27.json";
import piecesFile from "../../../data/intel/set-pieces/26-27.json";
import matchesFile from "../../../data/intel/matches/26-27.json";
import touchesFile from "../../../data/intel/touches/26-27.json";
import shotsFile from "../../../data/intel/shots/26-27.json";
import strengthFile from "../../../data/intel/strength/26-27.json";
import projectionsFile from "../../../data/intel/projections/26-27.json";
import careersFile from "../../../data/intel/careers/26-27.json";
import depthFile from "../../../data/intel/depth/26-27.json";

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
// **The XI is one rolling file**, like every other export here (Craig, 23 Sep 2026:
// "This shouldn't be a week doc. It should just always be live, and it's updated
// when scout updates it"). The app draws whichever eleven it holds and labels its
// round when it isn't the one on the heading (`xiRoundNote`); the paper only
// prints one made for the round it previews.

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

/** The latest predicted elevens Scout has, as the export left them. Its round is `manifest.gameweek`. */
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

/** Each club's Dixon-Coles attack and defence by FPL club code, and the export's manifest for its provenance line. */
export const intelStrength: Map<number, ClubStrength> = strengthIntel(strengthFile as unknown as IntelStrength);
export const intelStrengthManifest = (strengthFile as unknown as IntelStrength).manifest;

/** The sister model's projected FPL points by player code, and the export's manifest for its provenance line. */
export const intelProjections: Map<number, ProjectedPlayer> = projectionIntel(
  projectionsFile as unknown as IntelProjections,
);
export const intelProjectionsManifest = (projectionsFile as unknown as IntelProjections).manifest;

/** The club each man was at in each season the sister's identity store holds, by FPL code. */
export const intelCareers: Map<number, Map<string, string>> = careerIntel(careersFile as unknown as IntelCareers);
/** Each club's depth chart by its three-letter label, and the export's manifest for its date. */
export const intelDepth: Map<string, ClubDepth> = depthIntel(depthFile as unknown as IntelDepth);
export const intelDepthManifest = (depthFile as unknown as IntelDepth).manifest;
