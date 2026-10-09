import { notFound } from "next/navigation";
import type { Club, FootballSnapshot, Fixture } from "@epl/core";
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
