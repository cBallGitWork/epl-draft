import type { IntelAbsence, IntelClubXi } from "./types";

// RotoWire's EPL lineups page (https://www.rotowire.com/soccer/lineups.php), passed in as a string. Every man is a
// RotoWire id off his link; the caller joins ids to FPL codes, so nothing here is matched by name.

/** One side as RotoWire draws it, in RotoWire's own ids and club label. */
export interface RotowireSide {
  abbr: string;
  confirmed: boolean;
  formation: string;
  slots: Record<string, number> | null;
  starters: number[];
  absent: { rotowireId: number; status: IntelAbsence["status"] }[];
}

/** One match on the page, home side first. */
export interface RotowireTie {
  home: RotowireSide;
  away: RotowireSide;
}

const BOX = /<div class="lineup__box">([\s\S]*?)(?=<div class="lineup__box">|$)/g;
const ABBR = /<div class="lineup__abbr">([A-Z]+)<\/div>/g;
const LIST = /<ul class="lineup__list is-(home|visit)">([\s\S]*?)<\/ul>/g;
const PLAYER =
  /<div class="lineup__pos[^"]*">([^<]*)<\/div>\s*<a [^>]*href="\/soccer\/player\/[^"]*?-(\d+)"[^>]*>[\s\S]*?<\/a>\s*(?:<span class="lineup__inj">([A-Z]+)<\/span>)?/g;
const INJURIES = /<li class="lineup__title[^"]*">\s*Injuries/;

/** Each pitch row's position labels, goal first: `DL` is the back line, `DMC` the one ahead of it. */
const ROWS = [/^GK$/, /^D[LCR]$/, /^DM[LCR]$/, /^M[LCR]$/, /^AM[LCR]$/, /^FW[LCR]?$/];

/** RotoWire's tags, as the paper reads them: suspended is out. */
const TAGS: Record<string, IntelAbsence["status"]> = { OUT: "OUT", SUS: "OUT", QUES: "QUES" };

/** Every match on the page with both sides read; a page with no lineup boxes gives none. */
export function parseRotowireXi(html: string): RotowireTie[] {
  return [...html.matchAll(BOX)].flatMap(([, box]) => {
    const abbrs = [...box.matchAll(ABBR)].map(([, abbr]) => abbr);
    const lists = new Map([...box.matchAll(LIST)].map(([, at, body]) => [at, body]));
    const home = lists.get("home");
    const away = lists.get("visit");
    if (abbrs.length !== 2 || home === undefined || away === undefined) return [];
    return [{ home: side(abbrs[0], home), away: side(abbrs[1], away) }];
  });
}

function side(abbr: string, list: string): RotowireSide {
  const [eleven, injuries = ""] = list.split(INJURIES);
  const drawn = men(eleven);
  // Rows numbered as Scout numbers them, keeper "1" and each line drawn after it, so an empty line takes no number.
  const lines = [...new Set(drawn.map((man) => man.row))].sort((a, b) => a - b);
  const counts = lines.map((row) => drawn.filter((man) => man.row === row).length);
  const slots = Object.fromEntries(counts.map((count, at) => [String(at + 1), count]));

  const absent = new Map<number, IntelAbsence["status"]>();
  for (const man of [...drawn, ...men(injuries)]) if (TAGS[man.tag] !== undefined) absent.set(man.id, TAGS[man.tag]);
  return {
    abbr,
    confirmed: /Confirmed/i.test(eleven.split(/<li class="lineup__player">/)[0]),
    // The keeper is no part of a formation.
    formation: counts.slice(1).join("-"),
    slots: lines.every((row) => row >= 0) && lines[0] === 0 ? slots : null,
    // Goal first, then row by row; within a row right to left, as Scout ran them: RotoWire lists left to right.
    starters: lines.flatMap((row) => drawn.filter((man) => man.row === row).reverse()).map((man) => man.id),
    absent: [...absent].map(([rotowireId, status]) => ({ rotowireId, status })),
  };
}

/** Each man listed: his pitch row (-1 for a label no row takes), his RotoWire id and his tag, "" for none. */
function men(list: string): { row: number; id: number; tag: string }[] {
  return [...list.matchAll(PLAYER)].map(([, pos, id, tag = ""]) => ({
    row: ROWS.findIndex((row) => row.test(pos.trim())),
    id: Number(id),
    tag,
  }));
}

/** How sure a RotoWire eleven is taken to be: Scout's 0.9 for a prediction, certain once confirmed. */
const PREDICTED_PROB = 0.9;

/** One side in FPL codes, keyed by the club `clubOf` names. A man `codeOf` cannot join is left out and returned in
 *  `unjoined`, so the eleven falls short and `xiFault` refuses it rather than printing ten. */
export function joinRotowireSide(
  rw: RotowireSide,
  codeOf: (rotowireId: number) => number | null,
): { xi: IntelClubXi; unjoined: number[] } {
  const unjoined: number[] = [];
  const join = (id: number): number[] => {
    const code = codeOf(id);
    if (code === null) unjoined.push(id);
    return code === null ? [] : [code];
  };
  const prob = rw.confirmed ? 1 : PREDICTED_PROB;
  return {
    xi: {
      formation: rw.formation,
      slots: rw.slots,
      starters: rw.starters.flatMap(join).map((code) => ({ code, prob })),
      lineup: rw.confirmed ? "confirmed" : "predicted",
      absent: rw.absent.flatMap((man) => join(man.rotowireId).map((code) => ({ code, status: man.status }))),
    },
    unjoined: [...new Set(unjoined)],
  };
}
