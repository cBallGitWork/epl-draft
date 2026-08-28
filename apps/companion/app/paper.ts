import { type PublishedEdition, normalizePublished } from "@epl/core";
import published from "../../../data/editions/latest.json";

// Where the app reads the written column.
//
// A static import of a checked-in file, which is the same trick `squads.ts`
// plays with the identity bridge and for the same reason: the file is generated
// by a script, audited by a person, and lives at the edge where a person can see
// it. `packages/core/tsconfig.json` includes only `src/**/*.ts`, so core cannot
// reach `data/` at all, and that compiler boundary is what keeps it here.
//
// **It is baked in at build time, and that is the design rather than a
// limitation.** The column changes twice a week; the alternative is a runtime
// read of a file that changes twice a week, on every request, forever. The
// commit that writes an edition is the commit that deploys it — `vercel.json`
// excludes `data/snapshots` and `data/probes` from the build trigger and
// deliberately not this.
//
// `period: 0` is the seed's way of saying there is no column: no Fantrax period
// is numbered zero, so `editionMatches` answers false for every round and the
// paper prints its facts and no prose. A missing file would be a broken build;
// a seed is an honest empty.

export const edition: PublishedEdition | null = normalizePublished(published);
