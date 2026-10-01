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

/** The name a reporter prints: the surname without FPL's initial, "Fernandes" for "B.Fernandes". */
export function printName(player: FootballPlayer): string {
  return player.name.replace(/^(?:\p{Lu}\.\s*)+/u, "") || player.name;
}

/** A name as UK papers spell it: the BBC, the Premier League and Fantasy Football Scout all print Groß as "Gross". */
export const ukSpelling = (name: string) => name.replace(/ß/gu, "ss");

/** The name a paper prints first: "Bruno Fernandes" for FPL's "B.Fernandes" and "Erling Haaland", but "Rodri" and
 *  "Gabriel" as they are known, since their surname is not in their full name or is their first. */
export function fullPrintName(player: FootballPlayer): string {
  const known = printName(player);
  const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const words = player.fullName.split(/\s+/u).filter((w) => w !== "");
  const last = plain(known.split(/\s+/u).at(-1) ?? known);
  if (known === player.name && known.includes(" ")) return known;
  if (words.length === 0 || plain(words[0]) === plain(known) || !words.some((w) => plain(w) === last)) return known;
  return `${words[0]} ${known}`;
}

/** A keeper or defender's slot, and a midfielder or forward's: the two ends of a side. */
export const isBack = (slot: string) => slot === "G" || slot === "D";
export const isFront = (slot: string) => slot === "M" || slot === "F";

export function startsFor(sheet: Sheet, fantraxId: string): boolean {
  return sheet.starters.some((man) => man.fantraxId === fantraxId);
}

export function sitsFor(sheet: Sheet, fantraxId: string): boolean {
  return sheet.bench.some((man) => man.fantraxId === fantraxId);
}
