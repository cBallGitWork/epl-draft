import type { PlMoment } from "../../football/premierleague/moments";
import type { PlSquadMan, PlTeamSheet } from "../../football/premierleague/teamSheet";
import { surname } from "./keyStats";
import { isDismissal } from "./timeline";

// A side's line-up as a paper prints it under a report: the shape keeper first, each man with the one who replaced him and
// when, his booking or dismissal, his mark, and the substitutes not used. Built from the sheet's own formation lines; pure.

/** The man who came on for another, and the minute as printed; a substitute replaced in turn carries his own. */
export interface LineupSub {
  name: string;
  minute: string;
  booked: boolean;
  mark?: number | null;
  replacedBy?: LineupSub;
}

export interface LineupMan {
  name: string;
  booked: boolean;
  sentOff: boolean;
  replacedBy: LineupSub | null;
  /** Our mark out of ten; null when too brief to rate, absent on a report filed before marks. */
  mark?: number | null;
}

export interface StoryLineup {
  formation: string | null;
  /** Keeper first, then each line as the sheet draws it. */
  lines: LineupMan[][];
  unused: string[];
}

export function lineupOf(sheet: PlTeamSheet, moments: readonly PlMoment[], marks?: ReadonlyMap<number, number | null>): StoryLineup {
  const booked = new Set(moments.filter((m) => m.kind === "booked").flatMap((m) => (m.men[0] === null ? [] : [m.men[0]])));
  const off = new Set(moments.filter((m) => isDismissal(m.kind)).flatMap((m) => (m.men[0] === null ? [] : [m.men[0]])));
  const byCode = new Map([...sheet.lineup, ...sheet.substitutes].flatMap((man) => (man.code === null ? [] : [[man.code, man] as const])));
  const replaced = new Map<number, { on: number; minute: string }>();
  for (const m of moments) if (m.kind === "substitution" && m.men[0] !== null && m.men[1] !== null) replaced.set(m.men[1], { on: m.men[0], minute: m.minute });
  const used = new Set([...replaced.values()].map((r) => r.on));

  const markOf = (code: number | null) => (marks === undefined ? {} : { mark: code === null ? null : (marks.get(code) ?? null) });
  // `seen` stops a sheet that swaps two men back and forth from going round for ever.
  const sub = (code: number, seen: ReadonlySet<number>): LineupSub | null => {
    const swap = replaced.get(code);
    const on = swap === undefined ? undefined : byCode.get(swap.on);
    if (swap === undefined || on === undefined || seen.has(swap.on)) return null;
    const next = sub(swap.on, new Set([...seen, swap.on]));
    return { name: surname(on.name), minute: swap.minute, booked: booked.has(swap.on), ...markOf(swap.on), ...(next === null ? {} : { replacedBy: next }) };
  };
  const entry = (man: PlSquadMan): LineupMan => {
    const code = man.code;
    return {
      name: surname(man.name),
      booked: code !== null && booked.has(code),
      sentOff: code !== null && off.has(code),
      replacedBy: code === null ? null : sub(code, new Set([code])),
      ...markOf(code),
    };
  };
  const lines = sheet.shape ?? [sheet.lineup];
  return {
    formation: sheet.formation,
    lines: lines.map((line) => line.map(entry)),
    unused: sheet.substitutes.filter((man) => man.code === null || !used.has(man.code)).map((man) => surname(man.name)),
  };
}
