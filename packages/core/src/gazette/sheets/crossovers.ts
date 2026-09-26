import { SHEETS } from "../../config";
import { isBack, isFront, type Sheet, type SheetMan } from "./sheet";

// Where two sheets in one head-to-head meet on a real pitch: one side's attackers against the
// other's defence in the same match, or both sides starting from one club's defence.

export interface ClubPair {
  homeClubId: number;
  awayClubId: number;
}

export type Crossover =
  | { kind: "facing"; attackTeamId: string; attackers: SheetMan[]; defendTeamId: string; defenders: SheetMan[]; fixture: ClubPair }
  | { kind: "defence"; clubId: number; home: SheetMan[]; away: SheetMan[] };

/** Listed injured, suspended or gone: named on the sheet, meeting nobody on the pitch. */
const ABSENT = new Set(["i", "s", "u", "n"]);

/** The strongest few, in reading order: a forward against a keeper leads, then a shared defence. */
export function crossovers(home: Sheet, away: Sheet, fixtures: readonly ClubPair[]): Crossover[] {
  // Two sides fielding one club's attackers do not meet on the pitch, so a shared attack is not here.
  const found = [...facing(home, away, fixtures), ...facing(away, home, fixtures), ...sharedDefence(home, away)];
  return found.sort(byWeight).slice(0, SHEETS.crossovers);
}

function facing(attack: Sheet, defend: Sheet, fixtures: readonly ClubPair[]): Crossover[] {
  return fixtures.flatMap((fixture) =>
    [[fixture.homeClubId, fixture.awayClubId], [fixture.awayClubId, fixture.homeClubId]].flatMap(([from, against]) => {
      const attackers = playing(attack).filter((man) => isFront(man.slot) && man.player.clubId === from);
      const defenders = playing(defend).filter((man) => isBack(man.slot) && man.player.clubId === against);
      return attackers.length === 0 || defenders.length === 0
        ? []
        : [{ kind: "facing" as const, attackTeamId: attack.teamId, attackers, defendTeamId: defend.teamId, defenders, fixture }];
    }),
  );
}

function sharedDefence(home: Sheet, away: Sheet): Crossover[] {
  const kind = "defence" as const;
  const at = (sheet: Sheet) => playing(sheet).filter((man) => isBack(man.slot));
  const clubs = new Set(at(home).map((man) => man.player.clubId));
  return [...clubs].flatMap((clubId) => {
    const ours = at(home).filter((man) => man.player.clubId === clubId);
    const theirs = at(away).filter((man) => man.player.clubId === clubId);
    return theirs.length === 0 ? [] : [{ kind, clubId, home: ours, away: theirs }];
  });
}

function playing(sheet: Sheet): Sheet["starters"] {
  return sheet.starters.filter((man) => !ABSENT.has(man.player.status));
}

const KIND_ORDER = ["facing", "defence"] as const;

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
