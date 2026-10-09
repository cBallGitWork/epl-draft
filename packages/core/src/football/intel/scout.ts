import type { IntelClubXi, IntelXi } from "./types";

// Scout's predicted elevens off https://www.fantasyfootballscout.co.uk/team-news, passed in as a string.
// Each photo's filename is the man's FPL `code`, so nothing is matched by name.

const CLUB = /<li class="team-news-item" data-team-code="([a-z]+)"([\s\S]*?)(?=<li class="team-news-item"|$)/gi;
const FORMATION = /\bformation-([\d-]+)\b/;
const ROW = /<ul class="row-(\d)">([\s\S]*?)<\/ul>/gi;
const PLAYER = /\/players\/\d+x\d+\/(\d+)\.png/g;

/** How sure a Scout prediction is taken to be: the value the sister's export carried. */
const SCOUT_PROB = 0.9;

/** Every club's predicted eleven on the page, keyed by FPL short name (`ARS`). `slots`
 *  counts the men Scout draws in each row, so `xiFault` catches a row drawn short. */
export function parseScoutXi(html: string): Record<string, IntelClubXi> {
  const clubs: Record<string, IntelClubXi> = {};
  for (const [, code, block] of html.matchAll(CLUB)) {
    const starters: IntelClubXi["starters"] = [];
    const slots: Record<string, number> = {};
    for (const [, row, body] of block.matchAll(ROW)) {
      const codes = [...body.matchAll(PLAYER)].map(([, found]) => Number(found));
      slots[row] = codes.length;
      starters.push(...codes.map((found) => ({ code: found, prob: SCOUT_PROB })));
    }
    clubs[code.toUpperCase()] = { formation: FORMATION.exec(block)?.[1] ?? "", slots, starters };
  }
  return clubs;
}

/** The elevens as one string: the men, the shapes and the absences, club for club; equal strings are equal elevens. */
export function elevensKey(clubs: Record<string, IntelClubXi>): string {
  return JSON.stringify(
    Object.keys(clubs)
      .sort()
      .map((club) => {
        const { formation, starters, lineup = null, absent = [] } = clubs[club];
        return [club, formation, starters.map((man) => man.code), lineup, absent];
      }),
  );
}

/** Whether two sets of elevens name the same men in the same shapes, with the same absences, club for club. */
export function sameElevens(a: Record<string, IntelClubXi>, b: Record<string, IntelClubXi>): boolean {
  return elevensKey(a) === elevensKey(b);
}

/** Whether to rewrite the held file, and the moment the elevens were first seen: now for a change, or the held moment
 *  when unchanged elevens move to the next gameweek. A file left on a played gameweek reads as stale. */
export function xiToWrite(
  held: IntelXi | null,
  clubs: Record<string, IntelClubXi>,
  gameweek: number | null,
  now: string,
): { fetchedAt: string } | null {
  if (held === null || !sameElevens(held.clubs, clubs)) return { fetchedAt: now };
  return held.manifest.gameweek === gameweek ? null : { fetchedAt: held.fetchedAt ?? now };
}
