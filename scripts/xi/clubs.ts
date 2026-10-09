import { joinRotowireSide, xiFault, type IntelClubXi, type RotowireTie } from "@epl/core";

// RotoWire's ties joined to FPL codes and keyed by FPL club, keeping only full elevens in this gameweek's fixtures.

/** What the page gave: the clubs it filled, the men it could not join and why any club was refused. */
export interface RotowireClubs {
  clubs: Record<string, IntelClubXi>;
  unjoined: { abbr: string; rotowireId: number }[];
  refused: string[];
}

/** `codeOf` is the committed join (RotoWire id → Fantrax id → FPL code); `clubOf` names a code's FPL club. A side
 *  takes the club most of its starters play for, so RotoWire's own labels (`NOT`) are never translated by hand. */
export function rotowireClubs(
  ties: readonly RotowireTie[],
  codeOf: (rotowireId: number) => number | null,
  clubOf: (code: number) => string | null,
  fixtures: readonly { home: string; away: string }[],
): RotowireClubs {
  const result: RotowireClubs = { clubs: {}, unjoined: [], refused: [] };
  const playing = new Set(fixtures.map((tie) => `${tie.home} v ${tie.away}`));

  for (const tie of ties) {
    const [home, away] = [tie.home, tie.away].map((side) => {
      const joined = joinRotowireSide(side, codeOf);
      result.unjoined.push(...joined.unjoined.map((rotowireId) => ({ abbr: side.abbr, rotowireId })));
      return { abbr: side.abbr, club: mostOf(joined.xi.starters.map((man) => clubOf(man.code))), xi: joined.xi };
    });
    if (home.club === null || away.club === null || !playing.has(`${home.club} v ${away.club}`)) {
      result.refused.push(`${home.abbr} v ${away.abbr}: not one of this gameweek's fixtures`);
      continue;
    }
    for (const side of [home, away]) {
      const fault = xiFault(side.xi);
      if (fault === null) result.clubs[side.club as string] = side.xi;
      else result.refused.push(`${side.club}: ${fault}`);
    }
  }
  return result;
}

/** The commonest non-null name, or null when there is none. */
function mostOf(names: readonly (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const name of names) if (name !== null) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
