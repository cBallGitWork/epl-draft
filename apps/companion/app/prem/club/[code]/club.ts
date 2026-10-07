import { notFound } from "next/navigation";
import type { Club, FootballSnapshot, Fixture, TableRow } from "@epl/core";
import { leagueTable } from "@epl/core";
import { footballNow, seasonFixtures } from "../../../football";

// What every club tab reads, in one place; `squad/[teamId]/team.ts` is the fantasy twin.

/** One club by its FPL `code`, never `clubId` (recycled each season), with the snapshot and fixtures. */
export async function clubOr404(
  code: string,
): Promise<{ club: Club; snapshot: FootballSnapshot; fixtures: Fixture[] }> {
  const wanted = Number(code);
  // Reject anything that is not a plain club code before asking FPL for it —
  // "3.5" and "3abc" both coerce to something `Number` will happily accept.
  if (!Number.isInteger(wanted)) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const club = snapshot.clubs.find((entry) => entry.code === wanted);
  if (club === undefined) notFound();

  // The whole snapshot, so no tab calls `footballNow()` a second time.
  return { club, snapshot, fixtures };
}

/** Where the club stands, or null when unplaced; `leagueTable`'s order is the ranking. */
export function standing(
  fixtures: readonly Fixture[],
  clubs: readonly Club[],
  club: Club,
): { row: TableRow; place: number } | null {
  const table = leagueTable(fixtures, clubs);
  const at = table.findIndex((row) => row.clubId === club.id);
  const row = at === -1 ? undefined : table[at];
  return row === undefined ? null : { row, place: at + 1 };
}
