import type { Legs } from "./schedule";

// The league's cups and its playoff, as Craig set them on 27 Sep. Fantrax runs no cups, and whether it
// can run this playoff (a one-leg play-in, then two-leg semi-finals) is unconfirmed; see PLATFORM_NOTES.

export interface GroupStage {
  groups: number;
  /** How many from each group reach the knockout; `seededBracket` gives the top of each a bye. */
  qualify: number;
  /** Times each pair meets. */
  meetings: number;
  /** A cup rule, so ours: what a group win and draw are worth. */
  points: { won: number; drawn: number };
  drawGameweek: number;
  firstGameweek: number;
}

/** Where the knockout's seeds come from. */
export type Seeding =
  | { from: "gameweek"; gameweek: number }
  | { from: "groups"; stage: GroupStage }
  | { from: "table"; places: number };

export interface Knockout {
  elimination: "single" | "double";
  legs: Legs;
  finalGameweek: number;
}

export interface Cup {
  id: string;
  name: string;
  seeding: Seeding;
  knockout: Knockout;
}

const ONE_LEG: Legs = { final: 1, semiFinals: 1, earlier: 1 };

export const CUPS: readonly Cup[] = [
  {
    id: "timbeibs",
    name: "Timbeibs Cup",
    seeding: { from: "gameweek", gameweek: 9 },
    // Gameweek 17 is Boxing Day.
    knockout: { elimination: "double", legs: ONE_LEG, finalGameweek: 17 },
  },
  {
    id: "davy-propper",
    name: "Davy Propper Cup",
    seeding: {
      from: "groups",
      stage: {
        groups: 2,
        qualify: 3,
        meetings: 1,
        points: { won: 3, drawn: 1 },
        drawGameweek: 19,
        firstGameweek: 21,
      },
    },
    // Two legs before the final is inferred: it is what fills GW26 to GW30 without a week off.
    knockout: { elimination: "single", legs: { final: 1, semiFinals: 2, earlier: 2 }, finalGameweek: 30 },
  },
  {
    id: "playoffs",
    name: "Playoffs",
    seeding: { from: "table", places: 5 },
    // The last gameweek is inferred; it puts the play-in on GW35 and ends the season on GW34.
    knockout: { elimination: "single", legs: { final: 1, semiFinals: 2, earlier: 1 }, finalGameweek: 38 },
  },
];
