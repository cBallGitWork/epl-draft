import type { MatchStatRow } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { PANEL } from "@/app/desk";

// Championship Manager's Match Stats board — `cm9900/22.jpg`, row for row.
//
// **The tab CM has always had and we could not fill.** `MatchTabs` shipped two
// plates where the game runs four, on the stated ground that *"the two missing
// ones are the two we have no data for"*. That stopped being true the day
// `fetchPlMatchStats` was written: ~151 Opta metrics a side, every one of the
// thirteen rows on the reference board, on a read that has sat in `client.ts`
// since 4 Sep with no caller in the app at all. Action Zones still has no source.
//
// **A figure plate each side, the label between them.** `22.jpg` draws the two
// sides' numbers on blue plates down the outside with the white label centred —
// which is why this is a three-column grid and not a table: the label is the
// axis and the figures are its ends, where a table would make one side the
// subject and the other a column.
//
// The plates take `--color-index`'s fill and NOT `cm-bevel`: `desk.css` opens
// with the rule that a bevel is never on a repeating row.

/** The rows CM prints in a colour rather than in white.
 *
 *  Both are cards and both are the card's own colour, which is the reference
 *  doing exactly what DESIGN §3 does — `--color-accent` for a booking and
 *  `--color-bad` for a sending off. Keyed rather than matched on the label,
 *  because a label is prose and this is a rule. */
const LABEL_INK: Record<string, string> = {
  yellowCards: "text-accent",
  redCards: "text-bad",
};

export default function MatchStats({ rows }: { rows: MatchStatRow[] | null }) {
  // Absent, not a board of noughts. A match nobody has played has no stats and
  // saying `0 Shots On Goal 0` would be a claim about an afternoon that has not
  // happened (DESIGN §7).
  if (rows === null || rows.length === 0) {
    return (
      <Nothing title="No stats yet">
        Opta publishes a match&rsquo;s figures once it has been played.
      </Nothing>
    );
  }

  return (
    <section className={PANEL}>
      <h2 className="sr-only">Match stats</h2>
      {/* **Capped, because the reference is a proportion and not a pixel
          width.** `22.jpg`'s board runs about 690px inside an 800px canvas, so
          the two plates sit near the ends of a label that is comfortably
          readable between them. Stretched to 1440 the same markup put a
          thousand pixels of turf between `14` and `10` and the row stopped
          reading as one row. */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
        {rows.map((row) => (
          <Row key={row.key} row={row} />
        ))}
      </div>
    </section>
  );
}

function Row({ row }: { row: MatchStatRow }) {
  return (
    <div className="grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-2">
      <Figure value={row.home} percent={row.percent} />
      <span
        className={`text-center text-2xs font-bold uppercase lg:text-sm ${
          LABEL_INK[row.key] ?? "text-ink"
        }`}
      >
        {row.label}
      </span>
      <Figure value={row.away} percent={row.percent} />
    </div>
  );
}

/** One side's figure on its plate.
 *
 *  **Cyan for a percentage** — DESIGN §3's `--color-info` is "a reading we
 *  derived", and the three rows wearing it here are the three `22.jpg` prints in
 *  cyan for the same reason: a proportion is ours, a count is Opta's.
 *
 *  **One blue plate for both sides, and not the club's own colour.** The first
 *  cut grounded each plate in its side's primary, on the reasoning that it tells
 *  the two ends of a row apart without a legend. Two things were wrong with it.
 *  `22.jpg` does not do it — Everton's figures and Arsenal's are on the SAME
 *  royal blue, and the sides are told apart by which end they are at, exactly as
 *  the score bar above already says. And it broke the contrast floor: cyan on a
 *  club primary measured **3.5:1 against a required 4.5** on all six percentage
 *  cells at both widths, which is DESIGN §2's "a plate owns its ink" being
 *  ignored by a call site. `sweep` caught it; the picture looked fine.
 *
 *  So no club reaches this component at all any more, which is the honest shape:
 *  a board that does not colour by side has no business being handed the sides.
 */
function Figure({ value, percent }: { value: number; percent: boolean }) {
  return (
    <span
      className={`cm-index numeric flex h-6 items-center justify-center text-sm font-bold lg:h-7 lg:text-base ${
        percent ? "text-info" : "text-cream"
      }`}
    >
      {value}
      {percent ? "%" : ""}
    </span>
  );
}
