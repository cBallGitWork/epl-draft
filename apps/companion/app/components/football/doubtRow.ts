import { type DoubtBand, type FootballPlayer, availabilityOf, doubtBand } from "@epl/core";

/** The wash across a row for how likely its man is to miss: red out, orange a major doubt, yellow a
 *  slight one (DESIGN §3's doubt ramp). Class names written out, because Tailwind and `desk.css`
 *  read them literally. */
const WASH = { out: "cm-doubt-out", major: "cm-doubt-major", slight: "cm-doubt-slight" } as const;

/** The wash for a band, or "" for none: for a row that holds a band rather than a footballer. */
export function doubtWash(band: DoubtBand | null): string {
  return band === null ? "" : WASH[band];
}

/** The row's wash, or "" for a fit man and one the bridge has not settled. */
export function doubtRow(player: FootballPlayer | null): string {
  return doubtWash(doubtBand(availabilityOf(player)));
}
