import { toFplClubCode, type Club, type SeasonTotals } from "@epl/core";

// Data › Teams: a real club seen by a fantasy manager. Fantrax's points summed by club and by the position
// Fantrax lists, its keepers' clean sheets and goals against, our strength run, and FPL's expected figures.
// FPL's goals, assists and clean sheets never sit here beside a Fantrax figure (DESIGN §7).

/** One man in the pool, as the board needs him. Fantrax's club spelling; his keeper line when he is one. */
export interface PoolMan {
  club: string | null;
  position: string | null;
  owned: boolean;
  points: number | null;
  cleanSheets: number | null;
  goalsAgainst: number | null;
}

export interface TeamRow {
  club: Club;
  fpts: number | null;
  /** Points held by men nobody in the league owns. */
  fa: number | null;
  /** The mean ease rank of the next six opponents, 1 the kindest; ours. */
  attack: number | null;
  defence: number | null;
  gk: number | null;
  def: number | null;
  mid: number | null;
  fwd: number | null;
  cs: number | null;
  ga: number | null;
  xg: number | null;
  xa: number | null;
  /** FPL's squad xGC counts each chance against once per man on the pitch; eleven men share one. */
  xgc: number | null;
}

/** Fantrax's position letters, as the board's four columns. */
const POSITION: Record<string, "gk" | "def" | "mid" | "fwd"> = { G: "gk", D: "def", M: "mid", F: "fwd" };

/** Every club's row, in the clubs' order. A figure no man carries is null (a dash), never nought. */
export function teamRows(
  clubs: readonly Club[],
  men: readonly PoolMan[],
  season: ReadonlyMap<number, SeasonTotals>,
  runs: { attack: ReadonlyMap<number, number>; defence: ReadonlyMap<number, number> },
): TeamRow[] {
  const byShort = new Map(clubs.map((club) => [club.shortName, club]));
  const rows = new Map(
    clubs.map((club): [number, TeamRow] => {
      const squad = season.get(club.id);
      return [
        club.id,
        {
          club,
          fpts: null,
          fa: null,
          attack: runs.attack.get(club.code) ?? null,
          defence: runs.defence.get(club.code) ?? null,
          gk: null,
          def: null,
          mid: null,
          fwd: null,
          cs: null,
          ga: null,
          xg: squad ? squad.expectedGoals : null,
          xa: squad ? squad.expectedAssists : null,
          xgc: squad ? squad.expectedGoalsConceded / 11 : null,
        },
      ];
    }),
  );

  for (const man of men) {
    const club = man.club === null ? undefined : byShort.get(toFplClubCode(man.club));
    const row = club === undefined ? undefined : rows.get(club.id);
    if (row === undefined) continue;
    if (man.points !== null) {
      row.fpts = add(row.fpts, man.points);
      if (!man.owned) row.fa = add(row.fa, man.points);
      const slot = man.position === null ? undefined : POSITION[man.position];
      if (slot !== undefined) row[slot] = add(row[slot], man.points);
    }
    if (man.position === "G") {
      if (man.cleanSheets !== null) row.cs = add(row.cs, man.cleanSheets);
      if (man.goalsAgainst !== null) row.ga = add(row.ga, man.goalsAgainst);
    }
  }
  return [...rows.values()];
}

function add(total: number | null, value: number): number {
  return (total ?? 0) + value;
}
