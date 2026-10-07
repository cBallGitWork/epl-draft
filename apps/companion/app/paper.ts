import { FANTRAX_LEAGUE_ID, type PublishedStory, normalizePaper } from "@epl/core";
import paper from "../../../data/editions/paper.json";

// The rolling paper, baked in at build time: the commit that files a story is the one that deploys it.
// `normalizePaper` keeps the served league's stories; `edition.ts` orders them, since it owns the clock.

export const filed: PublishedStory[] = normalizePaper(paper, FANTRAX_LEAGUE_ID);

