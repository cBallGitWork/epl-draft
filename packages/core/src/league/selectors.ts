import type { LeaguePlayer, LeaguePlayerState, PeriodRosters } from "./types";

// Pure read-side selectors over league state, kept out of the components so they
// stay unit-testable — the same rule the football layer's selectors follow.

/** A footballer in Fantrax's global EPL pool, seen through our competition.
 *
 *  Three sources meet here and they are three different things, which is why the
 *  pool entry stays nested rather than being flattened into one row: `player` is
 *  whole-of-Fantrax and identical in every league on the site, `eligiblePositions`
 *  and `status` are what OUR commissioner has decided, and `ownerTeamId` is this
 *  week's roster. Flattening them would put the commissioner's opinion and
 *  Fantrax's global one in adjacent fields with nothing left to say which is
 *  which. */
export interface PoolPlayer {
  player: LeaguePlayer;
  /** What this league deems him eligible to play as. Empty when it has not said
   *  — never a guess taken from `player.position`, which is Fantrax's global
   *  default and not our commissioner's setting. */
  eligiblePositions: string[];
  /** Fantrax's own code — "FA", "WW", "T". Raw, because the vocabulary is theirs:
   *  an undrafted league marks all 697 players "WW" while a drafted one splits
   *  them across all three, so anything keying off a particular letter would be
   *  reading a league state as a player fact. */
  status: string;
  /** Null when nobody holds him — which is every player in a league that has not
   *  drafted, and is not the same statement as `status`. */
  ownerTeamId: string | null;
}

/** The pool, ordered as a person reads it and answering "whose is he".
 *
 *  Ownership is computed from the rosters rather than taken from `status`, and
 *  the two are not interchangeable: `status` says what may be done with a player
 *  under the league's transaction rules, the rosters say who has him. A league
 *  with no teams answers "nobody owns anybody" while still calling all 697
 *  waiver-wire, and both statements are true. */
export function leaguePool(
  pool: readonly LeaguePlayer[],
  states: readonly LeaguePlayerState[],
  rosters: PeriodRosters,
): PoolPlayer[] {
  const byId = new Map(states.map((state) => [state.fantraxId, state]));
  const owners = new Map<string, string>();
  for (const team of rosters.teams) {
    for (const slot of team.slots) owners.set(slot.fantraxId, team.teamId);
  }

  return pool
    .map((player) => {
      // A pool entry our league has no state for is still a real footballer, so
      // he is listed with nothing claimed about him rather than dropped.
      const state = byId.get(player.fantraxId);
      return {
        player,
        eligiblePositions: state?.eligiblePositions ?? [],
        status: state?.status ?? "",
        ownerTeamId: owners.get(player.fantraxId) ?? null,
      };
    })
    .sort((a, b) => a.player.displayName.localeCompare(b.player.displayName));
}
