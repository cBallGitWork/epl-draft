// The sister repo's role codes in CM's words, `Defender/Defensive Midfielder (Left/Centre)` (`cm9900/11.jpg`). Apart
// from `positions.ts`, whose letters are Fantrax's fantasy classification; an unknown code prints as itself.

interface Role {
  /** CM's own word for the job. */
  role: string;
  /** CM's own word for the flank, or null for a role that has no side. */
  side: string | null;
}

/** The sister repo's codes, written out: a first letter is not a side (`CM`, `CF`). */
const ROLES: Record<string, Role> = {
  GK: { role: "Goalkeeper", side: null },

  CB: { role: "Defender", side: "Centre" },
  // A left- or right-sided centre-half is still a centre-half.
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
  // CM has no Winger: an attacking midfielder on a flank.
  LW: { role: "Attacking Midfielder", side: "Left" },
  RW: { role: "Attacking Midfielder", side: "Right" },

  ST: { role: "Striker", side: null },
  CF: { role: "Forward", side: "Centre" },
};

/** `Defender (Centre/Right)`: roles and sides each de-duplicated, in the order given; null with nothing to say. */
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
