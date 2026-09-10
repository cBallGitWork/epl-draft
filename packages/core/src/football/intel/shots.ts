import type { IntelManifest } from "./types";

// Every shot, and where it was struck from.
//
// **The second map kind, and the one that makes a picker worth drawing.** The
// control is built from the kinds actually present (`intel-export.md`), so one
// kind is a control with nothing to choose.
//
// **The coordinates are already normalised and must not be touched again.**
// SofaScore publishes a shot as DISTANCE FROM THE ATTACKING GOAL — x from 0.8 to
// 52.6, penalties at exactly 11.5 — which is a different convention from the
// same provider's touch clouds, where x already runs from a man's own goal to
// the one he attacks. The exporter flips it so both arrive on one convention;
// the app must not learn two. Verified on the way through: penalties land at
// 88.5, goals average x=89.8 against a miss's 84.7.

/** One shot. Every vocabulary here is a closed set the exporter enforces — a
 *  value it has not heard of is dropped and named in the manifest, because a
 *  screen colouring by outcome cannot render a word it has never heard. */
export interface Shot {
  /** FPL's season-stable code. */
  code: number;
  fplFixtureId: number;
  minute: number | null;
  /** 0–100, his own goal to the one he attacks. */
  x: number;
  y: number;
  xg: number | null;
  /** Expected goals ON TARGET — what the strike was worth once it had left his
   *  foot, which is a different question from what the chance was worth. Null on
   *  a shot that never troubled the frame. */
  xgot: number | null;
  outcome: "goal" | "save" | "miss" | "block" | "post";
  situation: string | null;
  bodyPart: string | null;
}

export interface IntelShots {
  manifest: IntelManifest;
  shots: Shot[];
}

/** Every man's shots, by code, with the unusable rows left out.
 *
 *  Dropped rather than repaired, on `touchIntel`'s precedent: a shot keyed on
 *  `NaN` or plotted off the pitch is a mark that looks exactly like a real one,
 *  which is the confident wrong answer the app refuses. */
export function shotIntel(shots: IntelShots | null): Map<number, Shot[]> {
  const byCode = new Map<number, Shot[]>();
  if (shots === null) return byCode;
  for (const shot of shots.shots ?? []) {
    if (!Number.isInteger(shot?.code)) continue;
    if (!Number.isInteger(shot.fplFixtureId)) continue;
    if (!inside(shot.x) || !inside(shot.y)) continue;
    const mine = byCode.get(shot.code);
    if (mine === undefined) byCode.set(shot.code, [shot]);
    else mine.push(shot);
  }
  return byCode;
}

/** One man's shots, across every fixture or just one. */
export function shotsOf(shots: Shot[] | undefined, fixture: number | null): Shot[] {
  if (shots === undefined) return [];
  return fixture === null ? shots : shots.filter((shot) => shot.fplFixtureId === fixture);
}

function inside(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}
