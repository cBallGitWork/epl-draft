import { FANTRAX_LEAGUE_ID, FantraxError, fetchTeamBadges, mapTeamBadges } from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The badge each manager picked for his own team, for every screen that names a
// team.
//
// Its own module because three surfaces want it — the schedule, the table and
// the matchups board — and the schedule had it privately inside a combined read
// the other two could not reach (CODE_RULES §1). One cache entry rather than
// three, which also matters: a badge changes about once a season and the boards
// polling it are the ones a phone refreshes every thirty seconds on a Saturday.
//
// A badge we cannot read costs a picture and nothing else, so the refusal is
// swallowed here rather than carried. `TeamBadge` already draws the manager's
// initial when there is no URL, which is the same answer this failure wants —
// unlike a missing score, where a dash and a nought are different claims.

/** Badge URLs by team id. Entries, not a `Map`: a cache round trip serialises,
 *  and a `Map` does not survive it. */
const read = leagueCache("team-badges",
  async (): Promise<[string, string][]> => {
    const raw = await orRefusal(fetchTeamBadges(FANTRAX_LEAGUE_ID));
    if (raw instanceof FantraxError) return [];
    return mapTeamBadges(raw).map((badge) => [badge.teamId, badge.url]);
  },
);

export async function teamBadges(): Promise<Map<string, string>> {
  return new Map(await read());
}
