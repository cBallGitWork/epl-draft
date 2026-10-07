import type { IntelClubXi } from "./types";

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

/** Whether two sets of elevens name the same men in the same shapes, club for club. */
export function sameElevens(a: Record<string, IntelClubXi>, b: Record<string, IntelClubXi>): boolean {
  const key = (clubs: Record<string, IntelClubXi>) =>
    JSON.stringify(
      Object.keys(clubs)
        .sort()
        .map((club) => [club, clubs[club].formation, clubs[club].starters.map((man) => man.code)]),
    );
  return key(a) === key(b);
}
