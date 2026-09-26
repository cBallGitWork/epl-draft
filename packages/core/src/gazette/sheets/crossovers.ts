import { SHEETS } from "../../config";
import type { Sheet, SheetMan } from "./sheet";

// Where two sheets in one head-to-head meet on a real pitch: one side's attackers against the
// other's defence in the same match, or both sides starting from one club's defence or attack.

export interface ClubPair {
  homeClubId: number;
  awayClubId: number;
}

export type Crossover =
  | { kind: "facing"; attackTeamId: string; attackers: SheetMan[]; defendTeamId: string; defenders: SheetMan[]; fixture: ClubPair }
  | { kind: "defence" | "attack"; clubId: number; home: SheetMan[]; away: SheetMan[] };

const BACK = new Set(["G", "D"]);
const FRONT = new Set(["M", "F"]);

/** The strongest few, in reading order: a forward against a keeper leads, then a shared defence. */
export function crossovers(home: Sheet, away: Sheet, fixtures: readonly ClubPair[]): Crossover[] {
  const found = [...facing(home, away, fixtures), ...facing(away, home, fixtures), ...shared(home, away, "defence"), ...shared(home, away, "attack")];
  return found.sort(byWeight).slice(0, SHEETS.crossovers);
}

function facing(attack: Sheet, defend: Sheet, fixtures: readonly ClubPair[]): Crossover[] {
  return fixtures.flatMap((fixture) =>
    [[fixture.homeClubId, fixture.awayClubId], [fixture.awayClubId, fixture.homeClubId]].flatMap(([from, against]) => {
      const attackers = attack.starters.filter((man) => FRONT.has(man.slot) && man.player.clubId === from);
      const defenders = defend.starters.filter((man) => BACK.has(man.slot) && man.player.clubId === against);
      return attackers.length === 0 || defenders.length === 0
        ? []
        : [{ kind: "facing" as const, attackTeamId: attack.teamId, attackers, defendTeamId: defend.teamId, defenders, fixture }];
    }),
  );
}

function shared(home: Sheet, away: Sheet, kind: "defence" | "attack"): Crossover[] {
  const end = kind === "defence" ? BACK : FRONT;
  const at = (sheet: Sheet) => sheet.starters.filter((man) => end.has(man.slot));
  const clubs = new Set(at(home).map((man) => man.player.clubId));
  return [...clubs].flatMap((clubId) => {
    const ours = at(home).filter((man) => man.player.clubId === clubId);
    const theirs = at(away).filter((man) => man.player.clubId === clubId);
    return theirs.length === 0 ? [] : [{ kind, clubId, home: ours, away: theirs }];
  });
}

const KIND_ORDER = ["facing", "defence", "attack"] as const;

/** Kind first, then a keeper in the firing line, then how many men it involves. */
function byWeight(a: Crossover, b: Crossover): number {
  return KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || Number(keeper(b)) - Number(keeper(a)) || men(b) - men(a);
}

function keeper(crossover: Crossover): boolean {
  return crossover.kind === "facing" && crossover.defenders.some((man) => man.slot === "G");
}

function men(crossover: Crossover): number {
  return crossover.kind === "facing" ? crossover.attackers.length + crossover.defenders.length : crossover.home.length + crossover.away.length;
}
