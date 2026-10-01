import type { FootballPlayer, FootballSnapshot, PlayerMatchStats, PlayerOwner } from "@epl/core";
import { crestUrl } from "@epl/core";

// This gameweek's leaders: Fantrax's points for the men it priced, and FPL's per-match measures for
// everyone who played, each joined to whoever holds him. Pure; the page does the reads.

/** The measures the view ranks, in the order it draws them. */
export const LEADER_STATS = ["points", "xg", "xa", "defcon"] as const;
export type LeaderStat = (typeof LEADER_STATS)[number];

export interface Leader {
  player: FootballPlayer;
  crest: string | null;
  owner: PlayerOwner | null;
  mine: boolean;
  value: number;
}

export function gameweekLeaders(opts: {
  snapshot: Pick<FootballSnapshot, "clubs" | "players">;
  stats: readonly PlayerMatchStats[];
  /** Every man Fantrax priced this period, eleven and reserves alike. */
  priced: readonly { fantraxId: string; points: number }[];
  /** The bridge: a Fantrax id's FPL code, or null. */
  codeOf: (fantraxId: string) => number | null;
  owners: Map<number, PlayerOwner> | undefined;
  mine: string | null;
  shown: number;
}): Record<LeaderStat, Leader[]> {
  const byId = new Map(opts.snapshot.players.map((p) => [p.id, p]));
  const byCode = new Map(opts.snapshot.players.map((p) => [p.code, p]));
  const clubs = new Map(opts.snapshot.clubs.map((c) => [c.id, c]));

  // Highest first, then by name so a tie holds its order between refreshes; a nought leads nothing.
  const top = (totals: Map<FootballPlayer, number>): Leader[] =>
    [...totals]
      .filter(([, value]) => value > 0)
      .sort(([a, x], [b, y]) => y - x || a.name.localeCompare(b.name))
      .slice(0, opts.shown)
      .map(([player, value]) => {
        const club = clubs.get(player.clubId);
        const owner = opts.owners?.get(player.code) ?? null;
        return { player, crest: club ? crestUrl(club) : null, owner, mine: owner !== null && owner.teamId === opts.mine, value };
      });

  // FPL writes the round's figure on each of a man's rows, so a double gameweek reads it once.
  const football = (measure: (row: PlayerMatchStats) => number) => {
    const round = new Map<FootballPlayer, number>();
    for (const row of opts.stats) {
      const player = byId.get(row.playerId);
      if (player !== undefined && row.minutes > 0) round.set(player, measure(row));
    }
    return top(round);
  };

  const points = new Map<FootballPlayer, number>();
  for (const { fantraxId, points: value } of opts.priced) {
    const code = opts.codeOf(fantraxId);
    const player = code === null ? undefined : byCode.get(code);
    if (player !== undefined) points.set(player, value);
  }

  return {
    points: top(points),
    xg: football((row) => row.expectedGoals),
    xa: football((row) => row.expectedAssists),
    defcon: football((row) => row.defensiveContribution),
  };
}
