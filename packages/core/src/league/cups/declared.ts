// The league's two cups, as Craig set them on 27 Sep. Fantrax runs no cups; it runs the playoff, which is
// read from `getLeagueInfo` and never declared here.

export interface GroupStage {
  groups: number;
  /** How many from each group reach the knockout; `seededBracket` gives the top of each a bye. */
  qualify: number;
  /** A cup rule, so ours: what a group win and draw are worth. */
  points: { won: number; drawn: number };
  drawGameweek: number;
  firstGameweek: number;
}

/** Where the knockout's seeds come from. A group stage's groups are drawn at random, off the app. */
export type Seeding = { from: "gameweek"; gameweek: number } | { from: "groups"; stage: GroupStage };

export interface Knockout {
  /** Every tie is one leg. */
  elimination: "single" | "double";
  finalGameweek: number;
}

export interface Cup {
  id: string;
  name: string;
  seeding: Seeding;
  knockout: Knockout;
}

export const CUPS: readonly Cup[] = [
  {
    id: "timbeibs",
    name: "Timbeibs Cup",
    seeding: { from: "gameweek", gameweek: 9 },
    // Gameweek 17 is Boxing Day.
    knockout: { elimination: "double", finalGameweek: 17 },
  },
  {
    id: "davy-propper",
    name: "Davy Propper Cup",
    seeding: {
      from: "groups",
      stage: {
        groups: 2,
        qualify: 3,
        points: { won: 3, drawn: 1 },
        drawGameweek: 19,
        firstGameweek: 22,
      },
    },
    knockout: { elimination: "single", finalGameweek: 30 },
  },
];
