import { isResolved } from "../join/roster";
import type { RosteredTeam } from "../join/roster";
import type { AvailabilityNote } from "./types";

// Who is in trouble, across every squad in the league.
//
// FPL has carried `news`, `status` and `chanceOfPlaying` on every player since
// the first day of this project and nothing has ever read them. This is the
// reader. Fantrax has its own injury notes and we deliberately ignore them: they
// arrive truncated with an ellipsis, and an injury is a football fact the
// football layer already holds in full.

/** Doubts worth printing, worst first.
 *
 *  Only rostered players: the pool has seven hundred footballers and most of
 *  them are nobody's problem. A note nobody in the league is holding is a
 *  newspaper reporting on a different competition. */
export function availability(teams: readonly RosteredTeam[]): AvailabilityNote[] {
  const notes: AvailabilityNote[] = [];

  for (const team of teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered)) continue;
      const { player } = rostered;

      // `status: "a"` with an empty note is a fit player. Anything else — a flag,
      // a percentage, or words — is something a manager may have to act on.
      const flagged = player.status !== "a" || player.news !== "" || player.chanceOfPlaying !== null;
      if (!flagged) continue;
      // A hundred percent with no news attached is FPL saying "he is fine".
      if (player.news === "" && player.chanceOfPlaying === 100) continue;

      notes.push({
        playerName: player.name,
        teamId: team.teamId,
        news: player.news,
        chance: player.chanceOfPlaying,
      });
    }
  }

  // Least likely to play first. Null means FPL has no opinion, which is less
  // urgent than a stated zero and more urgent than a stated hundred — so it
  // sorts between them rather than at either end.
  return notes.sort((a, b) => rank(a.chance) - rank(b.chance));
}

function rank(chance: number | null): number {
  return chance ?? 75;
}
