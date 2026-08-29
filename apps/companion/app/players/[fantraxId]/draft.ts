import { FANTRAX_LEAGUE_ID, FantraxError, fetchDraftResults, mapDraftPicks, pedigreeOf } from "@epl/core";
import type { Pedigree } from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { orRefusal } from "../../refusals";
import { playerProjection } from "../../scoreboard";
import { myTeamId } from "../../session";
import { getLeagueSquads, teamDisplay } from "../../squads";
import { getLeaguePool } from "../pool";

// The two things this profile asks our own league about a man that the football
// layer cannot answer: what his draft pick cost, and what Fantrax reckons he
// will do this week. Named for the reads rather than for the answers —
// `Pedigree.tsx` is one of the answers, and a case-insensitive filesystem will
// not hold both spellings of that word.
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

/** What Fantrax expects him to score in the round on screen, or null.
 *
 *  **Gated, and that is the whole reason it is not one line in the page.**
 *  Fantrax projects the ACTIVE section only, so a number here states that his
 *  manager has fielded him — the exact fact `docs/ui/conventions.md` makes a
 *  product invariant before a deadline. So this asks the same question the squad
 *  and head-to-head screens ask, `teamDisplay`, and answers null whenever the
 *  gate is shut. Your own team is open to you all week; everybody else's waits
 *  for its lineups to lock.
 *
 *  Null for a free agent too: nobody has fielded him, so there is nothing to
 *  project and nothing to withhold. */
export async function fantraxProjection(
  fantraxId: string,
  ownerTeamId: string | null,
): Promise<{ points: number; gameweek: number } | null> {
  if (ownerTeamId === null) return null;

  const squads = await getLeagueSquads();
  if ("undrafted" in squads || "unavailable" in squads) return null;
  if (squads.roundPeriod === null) return null;

  const mine = await myTeamId(squads.period.teams);
  if (teamDisplay(squads, ownerTeamId === mine).show !== "lineup") return null;

  const points = await playerProjection(squads.roundPeriod, ownerTeamId, fantraxId);
  return points === null ? null : { points, gameweek: squads.snapshot.gameweek };
}
