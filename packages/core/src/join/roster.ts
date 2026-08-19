import { playerByCode } from "../football/selectors";
import type { FootballPlayer, FootballSnapshot, PlayerMatchStats } from "../football/types";
import { type Bridge, type BridgeEntry, isUnmapped } from "../identity/bridge";
import type { PeriodRosters, RosterSlot } from "../league/types";

// Where the two layers meet, made concrete. The league layer knows whose team a
// player is on; the football layer knows what he actually did. Neither imports
// the other — this file imports both and is the only place the join happens.
//
// Pure, and the bridge arrives as an argument rather than being read from disk:
// `packages/core/tsconfig.json` includes only `src/**/*.ts`, so core physically
// cannot import `data/mappings/fantrax.json`. That compiler boundary is what
// keeps the persisted mapping at the edge where a human audits it.

/** Why a rostered slot has no footballer behind it.
 *
 *  Three states rather than one flag, because three different things are wrong
 *  and only one of them is fine. Collapsing them would mean telling a manager
 *  "we don't know who this is" when the honest answer is "FPL has never listed
 *  him", or the reverse. */
export type Unresolved =
  /** Recorded as having no FPL counterpart: Fantrax carries academy and fringe
   *  players FPL has never listed. A correct outcome, not a failure. The bridge
   *  knows whether a person confirmed it or the script assumed it; nothing on
   *  screen turns on the difference. */
  | "unmapped"
  /** The bridge has never seen this id. Someone joined the pool since the last
   *  `npm run bridge`. */
  | "unbridged"
  /** Bridged to a code no player in this snapshot has — FPL dropped him, or the
   *  snapshot predates his arrival. */
  | "absent";

export interface ResolvedPlayer {
  slot: RosterSlot;
  player: FootballPlayer;
  /** One row per fixture he appeared in this gameweek: two on a double, none
   *  before kickoff. Empty is the normal state most of the week. */
  stats: PlayerMatchStats[];
}

export interface UnresolvedPlayer {
  slot: RosterSlot;
  unresolved: Unresolved;
}

/** One roster slot, resolved as far as the bridge allows.
 *
 *  A union rather than a nullable `player`, so a caller cannot read the
 *  footballer without having decided what to render when there isn't one. An
 *  unresolved slot is still a slot: the manager holds him, and dropping him here
 *  would render a fifteen-man squad as fourteen with no indication why. */
export type RosteredPlayer = ResolvedPlayer | UnresolvedPlayer;

export function isResolved(rostered: RosteredPlayer): rostered is ResolvedPlayer {
  return "player" in rostered;
}

export interface RosteredTeam {
  teamId: string;
  teamName: string;
  players: RosteredPlayer[];
}

export interface RosteredPeriod {
  /** Carried through from the rosters, not inferred from the snapshot's
   *  gameweek: a period and a gameweek are numbered alike but owned by different
   *  systems, and only the league layer knows which period these rosters are. */
  period: number | null;
  teams: RosteredTeam[];
}

export function resolveRosters(
  snapshot: FootballSnapshot,
  rosters: PeriodRosters,
  bridge: Bridge,
): RosteredPeriod {
  const players = playerByCode(snapshot);
  const stats = statsByPlayer(snapshot);

  return {
    period: rosters.period,
    teams: rosters.teams.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      players: team.slots.map((slot) => resolveSlot(slot, players, stats, bridge)),
    })),
  };
}

function resolveSlot(
  slot: RosterSlot,
  players: Map<number, FootballPlayer>,
  stats: Map<number, PlayerMatchStats[]>,
  bridge: Bridge,
): RosteredPlayer {
  // Annotated because `Record<string, BridgeEntry>` indexes as always-present
  // without `noUncheckedIndexedAccess`, and a roster routinely names ids the
  // bridge has not seen yet.
  const entry: BridgeEntry | undefined = bridge[slot.fantraxId];
  if (!entry) return { slot, unresolved: "unbridged" };
  if (isUnmapped(entry)) return { slot, unresolved: "unmapped" };

  const player = players.get(entry.fplCode);
  if (!player) return { slot, unresolved: "absent" };

  // Stats are keyed by FPL's per-season id, which is correct here: both sides
  // come from the same snapshot. Only the bridge crosses seasons, and it holds
  // codes.
  return { slot, player, stats: stats.get(player.id) ?? [] };
}

/** Stats grouped by player, built once per call rather than scanned per slot:
 *  sixteen fifteen-man rosters against a full gameweek is 240 lookups, and this
 *  runs on every poll while a match is on. */
function statsByPlayer(snapshot: FootballSnapshot): Map<number, PlayerMatchStats[]> {
  const byPlayer = new Map<number, PlayerMatchStats[]>();
  for (const row of snapshot.stats) {
    const rows = byPlayer.get(row.playerId);
    if (rows) rows.push(row);
    else byPlayer.set(row.playerId, [row]);
  }
  return byPlayer;
}
