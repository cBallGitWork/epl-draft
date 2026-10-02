import { finiteOrNull } from "../untrusted";
import { eachPart, type LeagueProjectionPart, type SlotRates } from "./leagueProjection";

// `npm run draft-pack`'s file: the projection in our league's points for every pool man, at each slot he is eligible
// for, and the reading the boards take from it. A week the model has no reading for is null, never nought.

/** One slot's pricing of his window. */
export interface SlotPricing {
  total: number;
  perGw: (number | null)[];
  /** Total over the matches he is expected to play; null when none. */
  perMatch: number | null;
  /** The window's points by what earns them; `conceded` is every deduction. */
  parts: Record<LeagueProjectionPart, number>;
  partsPerGw: Record<LeagueProjectionPart, (number | null)[]>;
  /** His own DefCon and keeper points per 90 at the slot, after drawing toward its average. */
  rates: SlotRates;
}

export interface LeagueProjectionRow {
  fantraxId: string;
  fplCode: number;
  name: string;
  /** Fantrax's three letters for his club, and FPL's, which the crests key on. */
  club: string | null;
  fplClub: string;
  /** The slot Fantrax prices him at while nobody owns him. */
  pos: string | null;
  eligible: string[];
  /** The slot the row's own figures are priced at: whichever pays him most. */
  pricedAt: string;
  total: number;
  perGw: (number | null)[];
  perMatch: number | null;
  parts: Record<LeagueProjectionPart, number>;
  positions: Record<string, SlotPricing>;
  /** Averages over the window's weeks with a reading, and the minutes week by week. */
  start: number | null;
  minutes: number | null;
  minutesPerGw: (number | null)[];
  appearances: number;
  status: "fit" | "doubt" | "out";
  note: string | null;
  adp: number | null;
  owned: boolean;
}

export interface LeagueProjectionFile {
  generatedAt: string;
  method: string;
  /** The recorded league whose rules priced it. */
  league: string;
  periodsObserved: number[];
  projectionsExportedAt: string | null;
  gameweeks: number[];
  priors: Record<string, SlotRates>;
  players: LeagueProjectionRow[];
}

/** One man's window at his best slot, as the boards read it. */
export interface LeagueProjection {
  code: number;
  fantraxId: string;
  /** FPL's three letters. */
  club: string;
  slot: string;
  gameweeks: { gw: number; points: number | null; minutes: number | null; parts: Record<LeagueProjectionPart, number | null> }[];
}

/** Every man by FPL code at his best slot; a row without a code or a slot it was priced at is dropped. */
export function leagueProjectionIntel(file: LeagueProjectionFile | null): Map<number, LeagueProjection> {
  const byCode = new Map<number, LeagueProjection>();
  const gameweeks = file?.gameweeks ?? [];
  for (const row of file?.players ?? []) {
    const best = row?.positions?.[row.pricedAt];
    if (!Number.isInteger(row?.fplCode) || best === undefined) continue;
    byCode.set(row.fplCode, {
      code: row.fplCode,
      fantraxId: row.fantraxId,
      club: row.fplClub ?? "",
      slot: row.pricedAt,
      gameweeks: gameweeks.map((gw, at) => ({
        gw,
        points: finiteOrNull(best.perGw?.[at]),
        minutes: finiteOrNull(row.minutesPerGw?.[at]),
        parts: eachPart((part) => finiteOrNull(best.partsPerGw?.[part]?.[at])),
      })),
    });
  }
  return byCode;
}
