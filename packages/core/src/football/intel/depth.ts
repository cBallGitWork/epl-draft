import type { IntelManifest } from "./types";

// A club's depth chart, as the sister repo deals it: every shirt in its formation and the men in
// line for it, best first. Keyed on FPL's season-stable code; the club by FPL's three-letter label.

export interface DepthHolder {
  code: number;
  /** His share of the shirt's minutes this round, 0 to 1. */
  share: number;
}

export interface DepthSlot {
  /** The shirt, `LCB`, `DM`, `ST`. */
  slot: string;
  label: string;
  /** How many of this shirt the formation fields: two for a pair of holding midfielders. */
  shirts: number;
  holders: DepthHolder[];
}

export interface ClubDepth {
  formation: string;
  slots: DepthSlot[];
}

export interface IntelDepth {
  manifest: IntelManifest;
  clubs: Record<string, ClubDepth>;
}

/** Each club's chart by its three-letter label, with holders that cannot be keyed dropped. */
export function depthIntel(depth: IntelDepth | null): Map<string, ClubDepth> {
  const byClub = new Map<string, ClubDepth>();
  for (const [club, chart] of Object.entries(depth?.clubs ?? {})) {
    const slots = (chart?.slots ?? []).map((slot) => ({
      ...slot,
      shirts: Math.max(1, Math.round(slot.shirts ?? 1)),
      holders: (slot.holders ?? []).filter((holder) => Number.isInteger(holder?.code)),
    }));
    byClub.set(club, { formation: chart?.formation ?? "", slots });
  }
  return byClub;
}

/** One place on the pitch: a shirt and the men in line for it there. */
export interface DepthSpot {
  slot: string;
  label: string;
  holders: DepthHolder[];
}

/** How deep a spot is drawn: three for a lone shirt, two each for a pair. */
const SHOWN = { single: 3, shared: 2 };

/** A shirt dealt into its spots; a pair snakes: first choice in one, second and third in the other, fourth under first. */
export function spotsOf(slot: DepthSlot): DepthSpot[] {
  if (slot.shirts === 1) {
    return [{ slot: slot.slot, label: slot.label, holders: slot.holders.slice(0, SHOWN.single) }];
  }
  const spots: DepthSpot[] = Array.from({ length: slot.shirts }, () => ({ slot: slot.slot, label: slot.label, holders: [] }));
  slot.holders.slice(0, slot.shirts * SHOWN.shared).forEach((holder, at) => {
    const lap = Math.floor(at / slot.shirts);
    const place = at % slot.shirts;
    spots[lap % 2 === 0 ? place : slot.shirts - 1 - place].holders.push(holder);
  });
  return spots;
}

/** The lines of the pitch from goal outward, each as the reader sees it with the keeper at the top: the
 *  team's right on the reader's left. A back three sends the full-backs up as wing-backs; with no
 *  attacking midfielder the wingers stand beside the striker. */
export function depthLines(club: ClubDepth): DepthSpot[][] {
  const has = (slot: string) => club.slots.some((entry) => entry.slot === slot);
  const backThree = has("CCB");
  const tenless = !has("AM");
  const line = (slot: string): number => {
    if (slot === "GK") return 0;
    if (slot === "LB" || slot === "RB") return backThree ? 2 : 1;
    if (slot.endsWith("CB")) return 1;
    if (slot === "DM" || slot === "CM") return 2;
    if (slot === "LW" || slot === "RW") return tenless ? 4 : 3;
    if (slot === "AM") return 3;
    return 4;
  };
  const across = ["RB", "RCB", "CCB", "LCB", "LB", "RW", "DM", "CM", "AM", "ST", "LW"];
  const order = (slot: string) => {
    if (slot === "RB" || slot === "RW") return 0;
    if (slot === "LB" || slot === "LW") return 2;
    return 1 + across.indexOf(slot) / across.length;
  };
  const lines: DepthSpot[][] = [[], [], [], [], []];
  for (const slot of [...club.slots].sort((a, b) => order(a.slot) - order(b.slot))) {
    lines[line(slot.slot)].push(...spotsOf(slot));
  }
  return lines.filter((row) => row.length > 0);
}
