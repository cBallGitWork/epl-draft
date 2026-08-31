import { FANTRAX_LEAGUE_ID, type PublishedStory, normalizePaper } from "@epl/core";
import paper from "../../../data/editions/paper.json";

// Where the app reads the rolling paper.
//
// A static import of a checked-in file, which is the same trick `squads.ts`
// plays with the identity bridge and for the same reason: the file is generated
// by a script, audited by a person, and lives at the edge where a person can see
// it. `packages/core/tsconfig.json` includes only `src/**/*.ts`, so core cannot
// reach `data/` at all, and that compiler boundary is what keeps it here.
//
// **It is baked in at build time, and that is the design rather than a
// limitation.** The commit that files a story is the commit that deploys it —
// `vercel.json` excludes `data/snapshots` and `data/probes` from the build
// trigger and deliberately not this.
//
// `normalizePaper` filters to the league THIS app serves, which is the whole
// rehearsal gate; ordering is `composePaper`'s and is applied by `edition.ts`,
// which owns the clock. The seed carries no stories, which is an honest empty —
// a missing file would be a broken build.

export const filed: PublishedStory[] = normalizePaper(paper, FANTRAX_LEAGUE_ID);
