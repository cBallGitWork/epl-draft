import { FANTRAX_LEAGUE_ID, FantraxError, fetchDraftResults, mapDraftPicks, pedigreeOf } from "@epl/core";
import type { DraftPick, Pedigree } from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { orRefusal } from "../../refusals";
import { getLeaguePool } from "../pool";

// What his draft pick cost: the draft read, joined to the pool `/players` already keeps warm.

/** A final board is held a day; a draft still running, or a refusal, is asked on the page window. */
const DRAFT_HELD = 60 * 60 * 24;

async function readPicks(): Promise<DraftPick[]> {
  const raw = await orRefusal(fetchDraftResults(FANTRAX_LEAGUE_ID));
  return raw instanceof FantraxError ? [] : mapDraftPicks(raw);
}

const heldDraft = leagueCache("draft-results", readPicks, () => [], DRAFT_HELD);
const runningDraft = leagueCache("draft-running", readPicks, () => []);

/** The held board once it has picks (`mapDraftPicks` gives none until the draft completes);
 *  until then the page window's, so a draft that finishes is seen within it, not a day later. */
async function draftPicks(): Promise<DraftPick[]> {
  const held = await heldDraft();
  return held.length > 0 ? held : runningDraft();
}

/** His pedigree, and the name of the team that spent the pick.
 *
 *  The name is looked up here rather than in the component for the reason every
 *  other join is: the component should be about what appears on screen. Null
 *  when the pool read failed, which costs the block and nothing else — the rest
 *  of the profile is a different set of reads. */
export async function playerPedigree(
  fantraxId: string,
): Promise<{ pedigree: Pedigree; drafterName: string | null }> {
  const [picks, pool] = await Promise.all([draftPicks(), getLeaguePool()]);
  if ("unavailable" in pool) return { pedigree: { origin: "unknown" }, drafterName: null };

  const scored = pool.rows.flatMap((row) => (row.stats === null ? [] : [row.stats]));
  const pedigree = pedigreeOf(fantraxId, picks, scored);

  return {
    pedigree,
    drafterName:
      pedigree.origin === "draft" ? (pool.teamNames.get(pedigree.teamId) ?? null) : null,
  };
}
