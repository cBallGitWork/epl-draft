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

/** Every shot in one fixture, by the FPL code of the man who took it.
 *
 *  The inverse of `shotsOf`, and a match wants it: that answers "where does this
 *  man shoot from" across a season, this answers "what did this match look
 *  like". Keyed rather than flat because a match map draws the two sides
 *  differently and the caller decides which side a code is on — the export
 *  carries no team.
 *
 *  Oldest first within a man, which is the order they were taken. */
export function shotsInFixture(shots: Map<number, Shot[]>, fixture: number): Map<number, Shot[]> {
  const here = new Map<number, Shot[]>();
  for (const [code, his] of shots) {
    const mine = his.filter((shot) => shot.fplFixtureId === fixture);
    if (mine.length > 0) here.set(code, mine.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)));
  }
  return here;
}

/** The same shot seen from the other end of the pitch.
 *
 *  **Every coordinate in this export is PLAYER-relative** — `Shot.x` is "his own
 *  goal to the one he attacks", and the touch clouds are the same. That is right
 *  for a map of one man and wrong for a map of one MATCH: both sides are stored
 *  attacking right, so drawn straight they pile into the same half. Measured on
 *  a real fixture, 10 Sep 2026: both keepers averaged a low x — 13.0 and 7.4 —
 *  and both sides' forwards a high one, 64.9 and 70.3.
 *
 *  A **rotation and not two flips**, which is the part worth stating: turning the
 *  pitch around swaps left and right as well as ends, so `y` goes with `x`. A
 *  caller that mirrored only `x` would put a right winger on the left touchline,
 *  which is the bug the touch export had in its own axis and fixed upstream. */
export function mirrorShot(shot: Shot): Shot {
  return { ...shot, x: 100 - shot.x, y: 100 - shot.y };
}
