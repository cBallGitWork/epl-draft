import type { Deal } from "./types";

// The Bin: what the league has been doing on the wire, as trends rather than
// as a list.
//
// **Trends over a window, never one afternoon's business.** The week's
// business already prints every deal on the front page; a column that repeated
// it would be the same facts twice. What a column can say that a list cannot
// is who is churning, who is quietly rebuilding, and which man three managers
// have now had and dropped.
//
// Nothing here is advice. "You report, you do not advise" is in the house
// voice, and a waiver column is where a paper is most tempted to tip.

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
  /** Whether the last thing that happened to him was a drop — the obituary
   *  case, and the funniest line the column has. */
  dropped: boolean;
}

export interface WireFacts {
  /** Deals in the window, most active manager first. */
  teams: WireTeam[];
  /** Men who moved more than once, most-moved first. */
  passedAround: WirePlayer[];
  /** Everyone dropped in the window and not since reclaimed — the obituaries. */
  binned: string[];
  /** How many deals the window covered, so the column can say "a quiet week"
   *  honestly rather than inventing activity. */
  deals: number;
}

/** A man moved this many times in the window is a story rather than a
 *  transaction. Two: once is a signing, twice is a pattern. */
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

  // Oldest first, so the LAST thing recorded about a man is what became of
  // him. The feed arrives newest-first, which would answer the reverse.
  for (const deal of [...deals].reverse()) {
    for (const player of deal.inbound) {
      bump(player.teamId, "claimed");
      moves.set(player.playerName, (moves.get(player.playerName) ?? 0) + 1);
      lastWasDrop.set(player.playerName, false);
    }
    for (const player of deal.outbound) {
      bump(player.teamId, "dropped");
      moves.set(player.playerName, (moves.get(player.playerName) ?? 0) + 1);
      // A trade moves a man BETWEEN managers: he was not binned, he was sold.
      // Only a drop with nobody on the other side is an obituary.
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
