// The sister repo's role codes, in Championship Manager's own words.
//
// `cm9900/11.jpg` closes a player profile with `Defender/Defensive Midfielder
// (Left/Centre)` — the ROLES joined by a slash, the SIDES joined by a slash in
// brackets. That is the shape this builds.
//
// **A separate vocabulary from `positions.ts`, deliberately.** That file
// translates FANTRAX's four letters (`G` `D` `M` `F`), which are a commissioner
// setting and a fantasy classification. These twenty codes are the sister repo's
// reading of where a man actually plays, from a different provider with a
// different taxonomy. One file translating two vocabularies would invite the two
// being compared, and they are not comparable — `/prem/club/[code]` keeps them as
// two columns for exactly that reason and `SEASON_LOG` records that they "may
// never become one column".
//
// **Only `position` and `secondaryPositions` reach this.** `canCover` is the
// sister's DEPTH CHART — who could fill in — and it is not a list of positions a
// man plays: Maguire's is `DM/LB/RB` (Craig, 4 Sep 2026: "Maguire not a dm or
// rb"). It was printed here for one commit and was wrong on its face. 70 of 651
// men have a real secondary position; the rest print one role and that is the
// true answer.
//
// A code this table has never seen is printed verbatim, on `positions.ts`'s rule:
// an unknown position is still a position, and a guess is worse than the code.

interface Role {
  /** CM's own word for the job. */
  role: string;
  /** CM's own word for the flank, or null for a role that has no side. */
  side: string | null;
}

/** The sister repo's twenty codes, counted off `data/intel/squads/26-27.json` on
 *  4 Sep 2026. Written out literally rather than derived from the letters: `CM`
 *  is centre midfield and `CF` is centre forward, so a rule that read the first
 *  letter as a side would be wrong twice in the same table. */
const ROLES: Record<string, Role> = {
  GK: { role: "Goalkeeper", side: null },

  CB: { role: "Defender", side: "Centre" },
  // A left- or right-sided centre-half is still a centre-half. CM says Centre
  // and lets the foot say the rest.
  LCB: { role: "Defender", side: "Centre" },
  RCB: { role: "Defender", side: "Centre" },
  LB: { role: "Defender", side: "Left" },
  RB: { role: "Defender", side: "Right" },

  LWB: { role: "Wing Back", side: "Left" },
  RWB: { role: "Wing Back", side: "Right" },

  DM: { role: "Defensive Midfielder", side: "Centre" },
  CM: { role: "Midfielder", side: "Centre" },
  LM: { role: "Midfielder", side: "Left" },
  RM: { role: "Midfielder", side: "Right" },

  AM: { role: "Attacking Midfielder", side: "Centre" },
  CAM: { role: "Attacking Midfielder", side: "Centre" },
  LAM: { role: "Attacking Midfielder", side: "Left" },
  RAM: { role: "Attacking Midfielder", side: "Right" },
  // A winger is an attacking midfielder on a flank in CM's vocabulary — the game
  // has no separate Winger, and `cm9900/11.jpg`'s own subject is filed this way.
  LW: { role: "Attacking Midfielder", side: "Left" },
  RW: { role: "Attacking Midfielder", side: "Right" },

  ST: { role: "Striker", side: null },
  CF: { role: "Forward", side: "Centre" },
};

/** `Defender/Defensive Midfielder (Left/Centre)`, or null when there is nothing
 *  to say.
 *
 *  Roles and sides are each de-duplicated and kept in the order given, so a
 *  centre-half who also plays right-back reads `Defender (Centre/Right)` rather
 *  than `Defender/Defender (Centre/Right)`. */
export function realPositionLabel(
  position: string | null,
  secondary: readonly string[] = [],
): string | null {
  const codes = [position, ...secondary].filter((code): code is string => Boolean(code));
  if (codes.length === 0) return null;

  const roles: string[] = [];
  const sides: string[] = [];
  for (const code of codes) {
    const known = ROLES[code];
    // An unknown code is its own label and has no side we can claim to know.
    const role = known?.role ?? code;
    if (!roles.includes(role)) roles.push(role);
    if (known?.side && !sides.includes(known.side)) sides.push(known.side);
  }

  return sides.length === 0 ? roles.join("/") : `${roles.join("/")} (${sides.join("/")})`;
}
