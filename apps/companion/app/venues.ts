import table from "../../../data/leagues/venues.json";

// Each fantasy team's home ground, drawn behind the head-to-heads it hosts. Data, keyed by Fantrax team id:
// `data/leagues/venues.json`, a photograph under `public/` per team. `PhotoGround` falls back to the desk's.

/** A ground to draw, and its 16px placeholder where the table carries one. */
export interface Venue {
  src: string;
  blur?: string;
}

/** A team's venue in a table, or null for a team it does not list. */
export function venueFor(venues: Readonly<Record<string, Venue>>, teamId: string): Venue | null {
  return venues[teamId] ?? null;
}

/** The venue a team hosts at, from the committed table. */
export function venueOf(teamId: string): Venue | null {
  return venueFor(table.venues, teamId);
}
