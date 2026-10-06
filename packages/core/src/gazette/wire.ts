import type { Deal } from "./types";

// The Bin's facts: the wire over a window as trends (who churns, who is passed around), never a list or advice.

/** One manager's activity over the window. */
export interface WireTeam {
  teamId: string;
  claimed: number;
  dropped: number;
}

/** A player the wire keeps passing around. */
export interface WirePlayer {
  playerName: string;
  /** How many separate deals have moved him in the window. */
  moves: number;
  /** Whether the last thing that happened to him was a drop. */
  dropped: boolean;
}

export interface WireFacts {
  /** Each manager's claims and drops in the window, busiest first. */
  teams: WireTeam[];
  /** Men who moved more than once, most-moved first. */
  passedAround: WirePlayer[];
  /** Everyone dropped in the window and not since reclaimed. */
  binned: string[];
  /** How many deals the window covered, so a quiet week can say so. */
  deals: number;
}

/** Moves in the window that make a man "passed around". */
const PASSED_AROUND = 2;

export function wireFacts(deals: readonly Deal[]): WireFacts {
  const teams = new Map<string, WireTeam>();
  const moves = new Map<string, number>();
  const lastWasDrop = new Map<string, boolean>();

  const bump = (teamId: string | null, key: "claimed" | "dropped") => {
    if (teamId === null) return;
    const row = teams.get(teamId) ?? { teamId, claimed: 0, dropped: 0 };
    row[key] += 1;
    teams.set(teamId, row);
  };

  // Oldest first, so the last thing recorded about a man is what became of him.
  for (const deal of [...deals].reverse()) {
    for (const player of deal.inbound) {
      bump(player.teamId, "claimed");
      moves.set(player.playerName, (moves.get(player.playerName) ?? 0) + 1);
      lastWasDrop.set(player.playerName, false);
    }
    for (const player of deal.outbound) {
      bump(player.teamId, "dropped");
      moves.set(player.playerName, (moves.get(player.playerName) ?? 0) + 1);
      // A traded man was not binned: only a claim's outbound side is a drop.
      lastWasDrop.set(player.playerName, deal.kind === "claim");
    }
  }

  return {
    teams: [...teams.values()].sort(
      (a, b) => b.claimed + b.dropped - (a.claimed + a.dropped) || a.teamId.localeCompare(b.teamId),
    ),
    passedAround: [...moves.entries()]
      .filter(([, count]) => count >= PASSED_AROUND)
      .map(([playerName, count]) => ({
        playerName,
        moves: count,
        dropped: lastWasDrop.get(playerName) ?? false,
      }))
      .sort((a, b) => b.moves - a.moves || a.playerName.localeCompare(b.playerName)),
    binned: [...lastWasDrop.entries()]
      .filter(([, dropped]) => dropped)
      .map(([playerName]) => playerName)
      .sort((a, b) => a.localeCompare(b)),
    deals: deals.length,
  };
}
