import type { FootballPlayer, FootballSnapshot, PlayerMatchStats, PlayerOwner, RatingStore } from "@epl/core";
import { crestUrl } from "@epl/core";

// This gameweek's leaders: Fantrax's points for the men it priced, our marks as filed, and FPL's
// per-match measures for everyone who played, each joined to whoever holds him. Pure; the page reads.

/** The measures the view ranks, in the order it draws them. */
export const LEADER_STATS = ["points", "rating", "xg", "xa"] as const;
export type LeaderStat = (typeof LEADER_STATS)[number];

export interface Leader {
  player: FootballPlayer;
  crest: string | null;
  owner: PlayerOwner | null;
  mine: boolean;
  value: number;
}

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

export function gameweekLeaders(opts: {
  snapshot: Pick<FootballSnapshot, "clubs" | "players" | "fixtures">;
  stats: readonly PlayerMatchStats[];
  /** Every man Fantrax priced this period, eleven and reserves alike, by Fantrax id. */
  priced: ReadonlyMap<string, number>;
  /** Our filed marks, player code → fixture code; null where he was too brief to rate. */
  marks: RatingStore["marks"];
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
  for (const [fantraxId, value] of opts.priced) {
    const code = opts.codeOf(fantraxId);
    const player = code === null ? undefined : byCode.get(code);
    if (player !== undefined) points.set(player, value);
  }

  // A mark is per match, so a double gameweek averages his two.
  const thisRound = new Set(opts.snapshot.fixtures.map((f) => String(f.code)));
  const rating = new Map<FootballPlayer, number>();
  for (const [code, matches] of Object.entries(opts.marks)) {
    const player = byCode.get(Number(code));
    const given = Object.entries(matches).flatMap(([fixture, mark]) => (thisRound.has(fixture) && mark !== null ? [mark] : []));
    if (player !== undefined && given.length > 0) rating.set(player, oneDecimal(given.reduce((a, b) => a + b, 0) / given.length));
  }

  return {
    points: top(points),
    rating: top(rating),
    xg: football((row) => row.expectedGoals),
    xa: football((row) => row.expectedAssists),
  };
}
