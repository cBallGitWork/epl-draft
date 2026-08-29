import { FANTRAX_LEAGUE_ID, FantraxError, fetchDraftResults, mapDraftPicks, pedigreeOf } from "@epl/core";
import type { Pedigree } from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { orRefusal } from "../../refusals";
import { getLeaguePool } from "../pool";

// The draft, as one player's profile needs it: what his pick cost and what he
// has repaid. Named for the READ rather than for the answer — `Pedigree.tsx` is
// the answer, and a case-insensitive filesystem will not hold both spellings.
//
// Two reads, and neither is this page's own. The pool table is the one
// `/players` already keeps warm — the join needs every drafted man's ranking to
// say where this one would go now, and there is no smaller read that answers it.
// The draft is new and is the cheapest thing Fantrax serves.

/** **A draft does not change**, so this is held for a season rather than for a
 *  page window. The one thing that moves it is the draft itself running, and it
 *  runs once — the real league's is on 10 Oct, and until then the read answers a
 *  draft in progress, which `mapDraftPicks` refuses whole rather than serving
 *  half a board.
 *
 *  A refusal is empty rather than fatal: no picks reads as "we cannot say", which
 *  is exactly what a failed draft read means. */
const DRAFT_HELD = 60 * 60 * 24;

const readDraft = leagueCache(
  "draft-results",
  async () => {
    const raw = await orRefusal(fetchDraftResults(FANTRAX_LEAGUE_ID));
    return raw instanceof FantraxError ? [] : mapDraftPicks(raw);
  },
  DRAFT_HELD,
);

/** His pedigree, and the name of the team that spent the pick.
 *
 *  The name is looked up here rather than in the component for the reason every
 *  other join is: the component should be about what appears on screen. Null
 *  when the pool read failed, which costs the block and nothing else — the rest
 *  of the profile is a different set of reads. */
export async function playerPedigree(
  fantraxId: string,
): Promise<{ pedigree: Pedigree; drafterName: string | null }> {
  const [picks, pool] = await Promise.all([readDraft(), getLeaguePool()]);
  if ("unavailable" in pool) return { pedigree: { origin: "unknown" }, drafterName: null };

  const scored = pool.rows.flatMap((row) => (row.stats === null ? [] : [row.stats]));
  const pedigree = pedigreeOf(fantraxId, picks, scored);

  return {
    pedigree,
    drafterName:
      pedigree.origin === "draft" ? (pool.teamNames.get(pedigree.teamId) ?? null) : null,
  };
}
