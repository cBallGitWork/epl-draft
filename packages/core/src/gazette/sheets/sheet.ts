import type { FootballPlayer } from "../../football/types";
import { isResolved, type RosteredTeam } from "../../join/roster";
import { isActive } from "../../league/rosterStatus";

// One manager's side as Fantrax holds it for a period: who starts in which slot, and who sits.

export interface SheetMan {
  fantraxId: string;
  /** The roster slot he fills, which is what Fantrax scores; never his own position. */
  slot: string;
  player: FootballPlayer;
}

export interface Sheet {
  teamId: string;
  teamName: string;
  starters: SheetMan[];
  bench: SheetMan[];
}

/** The order a team sheet reads in; a slot Fantrax adds sorts last. */
const SLOT_ORDER = ["G", "D", "M", "F"];

export function sheetOf(team: RosteredTeam): Sheet {
  const rank = (slot: string) => (SLOT_ORDER.includes(slot) ? SLOT_ORDER.indexOf(slot) : SLOT_ORDER.length);
  const men = team.players
    .filter(isResolved)
    .map((man) => ({ active: isActive(man.slot), man: { fantraxId: man.slot.fantraxId, slot: man.slot.position ?? "", player: man.player } }))
    .sort((a, b) => rank(a.man.slot) - rank(b.man.slot));
  return {
    teamId: team.teamId,
    teamName: team.teamName,
    starters: men.filter((each) => each.active).map((each) => each.man),
    bench: men.filter((each) => !each.active).map((each) => each.man),
  };
}

/** Defenders, midfielders and forwards started, "3-4-3"; null for a side with nobody out there. */
export function formation(sheet: Sheet): string | null {
  const count = (slot: string) => sheet.starters.filter((man) => man.slot === slot).length;
  const outfield = ["D", "M", "F"].map(count);
  return outfield.every((n) => n === 0) ? null : outfield.join("-");
}

/** Before the draft Fantrax answers every period with empty rosters, which is no sheet at all. */
export function fielded(sheet: Sheet): boolean {
  return sheet.starters.length > 0;
}

export function startsFor(sheet: Sheet, fantraxId: string): boolean {
  return sheet.starters.some((man) => man.fantraxId === fantraxId);
}

export function sitsFor(sheet: Sheet, fantraxId: string): boolean {
  return sheet.bench.some((man) => man.fantraxId === fantraxId);
}
