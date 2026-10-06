import type { IntelManifest } from "./types";

// Every shot and where it was struck from. The exporter already flips x to the touch clouds' convention: never again.

/** One shot. Each vocabulary is a closed set: the exporter drops an unknown value and names it in the manifest. */
export interface Shot {
  /** FPL's season-stable code. */
  code: number;
  fplFixtureId: number;
  minute: number | null;
  /** 0–100, his own goal to the one he attacks. */
  x: number;
  y: number;
  xg: number | null;
  /** Expected goals on target: what the strike was worth, not the chance. Null on a shot off target. */
  xgot: number | null;
  outcome: "goal" | "save" | "miss" | "block" | "post";
  situation: string | null;
  bodyPart: string | null;
  /** Who made it — Understat's last touch before the shot, as an FPL code. Null when unassisted or unplaced. */
  assistCode: number | null;
  /** Where his key pass started, in the shot's own frame; null when none landed near the shot. */
  pass: { x: number; y: number } | null;
}

export interface IntelShots {
  manifest: IntelManifest;
  shots: Shot[];
}

/** Every man's shots by code; a row keyed on `NaN` or off the pitch is dropped, since it would look real. */
export function shotIntel(shots: IntelShots | null): Map<number, Shot[]> {
  const byCode = new Map<number, Shot[]>();
  if (shots === null) return byCode;
  for (const shot of shots.shots ?? []) {
    if (!Number.isInteger(shot?.code)) continue;
    if (!Number.isInteger(shot.fplFixtureId)) continue;
    if (!inside(shot.x) || !inside(shot.y)) continue;
    // An older export has neither field; a pass off the pitch is a mark that looks real, so it goes.
    const read: Shot = {
      ...shot,
      assistCode: Number.isInteger(shot.assistCode) ? shot.assistCode : null,
      pass: shot.pass != null && inside(shot.pass.x) && inside(shot.pass.y) ? shot.pass : null,
    };
    const mine = byCode.get(shot.code);
    if (mine === undefined) byCode.set(shot.code, [read]);
    else mine.push(read);
  }
  return byCode;
}

/** The shots a man set up, whoever struck them: his key passes, each carrying where it started. */
export function assistsOf(shots: ReadonlyMap<number, readonly Shot[]>, code: number): Shot[] {
  const made: Shot[] = [];
  for (const struck of shots.values()) {
    for (const shot of struck) if (shot.assistCode === code) made.push(shot);
  }
  return made;
}

/** One man's shots, across every fixture or just one. */
export function shotsOf(shots: Shot[] | undefined, fixture: number | null): Shot[] {
  if (shots === undefined) return [];
  return fixture === null ? shots : shots.filter((shot) => shot.fplFixtureId === fixture);
}

function inside(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Every shot in one fixture by the taker's code, earliest first; keyed because the export carries no team and the
 *  caller decides each code's side. */
export function shotsInFixture(shots: Map<number, Shot[]>, fixture: number): Map<number, Shot[]> {
  const here = new Map<number, Shot[]>();
  for (const [code, his] of shots) {
    const mine = his.filter((shot) => shot.fplFixtureId === fixture);
    if (mine.length > 0) here.set(code, mine.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)));
  }
  return here;
}

