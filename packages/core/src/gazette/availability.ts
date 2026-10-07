import { availabilityOf } from "../football/playerState";
import { isResolved } from "../join/roster";
import type { RosteredTeam } from "../join/roster";
import type { AvailabilityNote } from "./types";

// Who is in trouble across every squad, from FPL's news; Fantrax's notes arrive truncated and are not read.

/** Rostered players carrying a doubt, least likely to play first. */
export function availability(teams: readonly RosteredTeam[]): AvailabilityNote[] {
  const notes: AvailabilityNote[] = [];

  for (const team of teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered)) continue;
      const { player } = rostered;

      // The football layer's rule, so the player card cannot answer differently; the whole answer is kept.
      const state = availabilityOf(player);
      if (state.state === "fit") continue;

      notes.push({
        playerName: player.name,
        // A row wants the shirt's name and a letter the man's.
        fullName: player.fullName,
        // FPL's own stamp for the line, not the moment we read it.
        newsAt: player.newsAdded,
        teamId: team.teamId,
        ...state,
      });
    }
  }

  // Least likely to play first.
  return notes.sort((a, b) => rank(a.chance) - rank(b.chance));
}

/** Where FPL's null chance sorts: after the graver stated doubts, level with 75, before a stated hundred. */
const NO_OPINION_RANK = 75;

function rank(chance: number | null): number {
  return chance ?? NO_OPINION_RANK;
}
