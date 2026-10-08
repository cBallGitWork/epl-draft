import { FANTRAX_LEAGUE_ID, fetchDraftResults, mapDraftPicks, pedigreeOf } from "@epl/core";
import type { DraftPick, Pedigree } from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { refusedAs } from "../../refusals";
import { getLeaguePool } from "../pool";
import { shortName } from "../../teamNames";
import { FINAL_REVALIDATE } from "../../config";

// What his draft pick cost: the draft read, joined to the pool `/players` already keeps warm.

function readPicks(): Promise<DraftPick[]> {
  return refusedAs(fetchDraftResults(FANTRAX_LEAGUE_ID), () => [], mapDraftPicks);
}

// A final board is held as anything final is; a draft still running, or a refusal, is asked on the page window.
const heldDraft = leagueCache("draft-results", readPicks, () => [], FINAL_REVALIDATE);
const runningDraft = leagueCache("draft-running", readPicks, () => []);

/** The held board once it has picks (`mapDraftPicks` gives none until the draft completes);
 *  until then the page window's, so a draft that finishes is seen within it, not a day later. */
async function draftPicks(): Promise<DraftPick[]> {
  const held = await heldDraft();
  return held.length > 0 ? held : runningDraft();
}

/** His pedigree, and the short name of the team that spent the pick; unknown when the pool read failed. */
export async function playerPedigree(
  fantraxId: string,
): Promise<{ pedigree: Pedigree; drafterName: string | null }> {
  const [picks, pool] = await Promise.all([draftPicks(), getLeaguePool()]);
  if ("unavailable" in pool) return { pedigree: { origin: "unknown" }, drafterName: null };

  const scored = pool.rows.flatMap((row) => (row.stats === null ? [] : [row.stats]));
  const pedigree = pedigreeOf(fantraxId, picks, scored);

  const drafter = pedigree.origin === "draft" ? pool.teamNames.get(pedigree.teamId) : undefined;
  return {
    pedigree,
    drafterName: pedigree.origin === "draft" && drafter !== undefined ? shortName(pedigree.teamId, drafter) : null,
  };
}
