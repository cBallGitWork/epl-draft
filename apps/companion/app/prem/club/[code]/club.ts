import { notFound } from "next/navigation";
import type { Club, FootballSnapshot, Fixture, TableRow } from "@epl/core";
import { leagueTable } from "@epl/core";
import { footballNow, seasonFixtures } from "../../../football";

// What every club tab reads, in one place.
//
// `squad/[teamId]/team.ts` is the fantasy twin and this is deliberately its
// shape: the four tabs under a club all need the same two football reads, and a
// page that repeated the `Number.isInteger` guard and the `find` four times is
// four places for a 404 to stop working.

/** One club by its FPL code, with the season's football around it.
 *
 *  Keyed on the season-stable `code` and never `clubId`: a URL is persisted the
 *  moment somebody shares it, and FPL's per-season ids are recycled
 *  (CODE_RULES §3).
 *
 *  Both reads, because every tab needs both — the snapshot for the club and its
 *  players, the fixtures for anything that has happened or is going to. They
 *  are the app's two cached football reads, so a club page costs no request the
 *  section was not already making. */
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

  // **The whole snapshot, not a selection out of it.** This returned `clubs` and
  // the club's own `players`, which meant every tab that also wanted `clubById`
  // or the full player list called `footballNow()` a SECOND time — three of the
  // four did. Cached, so it cost no request, but two reads of one thing in one
  // render is two places for them to disagree, and it read as though the tab
  // were fetching something this did not have.
  return { club, snapshot, fixtures };
}

/** Where the club stands, or null when the competition has not placed it.
 *
 *  `leagueTable` returns the rows already in order and carries no rank of its
 *  own, because the list IS the ranking (`football/table.ts`) — so the place is
 *  the index, counted here rather than in each of four tabs. */
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
