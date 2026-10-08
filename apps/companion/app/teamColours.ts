import { coloursOf, type TeamColours } from "@epl/core";
import file from "../../../data/leagues/team-colours.json";

// A fantasy team's own colours, data keyed by Fantrax team id (`team` in the file is for the reader only). Spent only
// on the team's own title bar and each side of a head-to-head; `inkOn` picks each plate's ink.
const TABLE: Record<string, TeamColours> = file.teamColours;

/** A team's plate and trim, or core's neutral for a team the file does not list. */
export function teamColours(teamId: string): TeamColours {
  return coloursOf(TABLE, teamId);
}
