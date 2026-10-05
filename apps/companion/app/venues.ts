import type { GroundPhoto } from "@epl/core";
import table from "../../../data/leagues/venues.json";

// Each fantasy team's home ground, drawn behind the head-to-heads it hosts. Data, keyed by Fantrax team id:
// `data/leagues/venues.json`, a photograph under `public/` per team. `PhotoGround` falls back to the desk's.

/** Who took a venue's photograph and where it is, for `/credits`. */
export type VenueCredit = Pick<GroundPhoto, "title" | "author" | "licence" | "licenceUrl" | "source"> & { place: string };

/** A ground to draw, its 16px placeholder where the table carries one, and its credit unless it is the desk's own. */
export interface Venue {
  src: string;
  blur?: string;
  credit?: VenueCredit;
}

/** A team's venue in a table, or null for a team it does not list. */
export function venueFor(venues: Readonly<Record<string, Venue>>, teamId: string): Venue | null {
  return venues[teamId] ?? null;
}

/** The venue a team hosts at, from the committed table. */
export function venueOf(teamId: string): Venue | null {
  return venueFor(table.venues, teamId);
}

/** Each credited photograph in a table once, however many teams share it. */
export function creditsIn(venues: Readonly<Record<string, Venue>>): VenueCredit[] {
  const credits = Object.values(venues).flatMap((venue) => (venue.credit === undefined ? [] : [venue.credit]));
  return credits.filter((credit, i) => credits.findIndex((other) => other.source === credit.source) === i);
}

/** The committed table's credits. */
export function venueCredits(): VenueCredit[] {
  return creditsIn(table.venues);
}
