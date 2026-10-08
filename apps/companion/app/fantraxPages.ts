import { FANTRAX_LEAGUE_PAGE } from "@epl/core";

// The served league's pages on Fantrax's website, for handing a manager back to it; the paths are core's config.

/** A page of the league on Fantrax, at one period where the page takes one. */
export function fantraxPage(path: string, period?: number | null): string {
  return `${FANTRAX_LEAGUE_PAGE}/${path}${period === undefined || period === null ? "" : `;period=${period}`}`;
}
