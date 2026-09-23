import { isResolved, isUnmapped } from "@epl/core";
import { leagueInfo } from "../round";
import { bridge, getLeagueSquads } from "../squads";

// Our league's view of the footballers on the Premiership screens — a club's squad and a match's two sides.

/** What OUR league says about a footballer, by FPL code — Fantrax's letters, read through the bridge and shown
 *  beside his real position, never instead of it. Empty, not an error, when Fantrax will not answer. */
export interface LeagueOpinion {
  /** Fantrax's own id for him — what the player card's "Full profile" links to. */
  fantraxId: string;
  /** What this league deems him eligible to play as. */
  positions: string[];
  /** Fantrax's own code, raw: "T" taken, "WW" waivers, "FA" free agent. */
  status: string;
  /** The team holding him, by name, or null when nobody does. */
  owner: string | null;
}

export async function leagueOpinions(): Promise<Map<number, LeagueOpinion>> {
  const [info, squads] = await Promise.all([leagueInfo(), getLeagueSquads()]);
  if (info === null) return new Map();

  // The bridge runs Fantrax id → FPL code, so it is inverted; an unmapped row is a settled answer, not a gap.
  const fplCodeOf = new Map<string, number>();
  for (const [fantraxId, entry] of Object.entries(bridge)) {
    if (!isUnmapped(entry)) fplCodeOf.set(fantraxId, entry.fplCode);
  }

  // Who holds whom, off the already-resolved slots; an undrafted or unreadable league answers nobody.
  const owners = new Map<number, string>();
  if (!("undrafted" in squads) && !("unavailable" in squads)) {
    for (const team of squads.period.teams) {
      for (const held of team.players) {
        if (isResolved(held)) owners.set(held.player.code, team.teamName);
      }
    }
  }

  const opinions = new Map<number, LeagueOpinion>();
  for (const player of info.players) {
    const code = fplCodeOf.get(player.fantraxId);
    if (code === undefined) continue;
    opinions.set(code, {
      fantraxId: player.fantraxId,
      positions: player.eligiblePositions,
      status: player.status,
      owner: owners.get(code) ?? null,
    });
  }
  return opinions;
}
