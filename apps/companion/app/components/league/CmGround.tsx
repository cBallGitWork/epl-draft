import type { ReactNode } from "react";

// Championship Manager's pitch: flat, seen from directly above, drawn in lines.
//
// **It began as a trial** (Craig, 31 Aug): "pitch view doesn't really fit in with
// CM". `cm9900/19.jpg` is why he was right. The game's tactics screen puts the
// squad list down the left and, beside it, a plain green rectangle with white
// markings and numbered discs on it — no perspective and no photographs. What
// this replaced was FPL's: a trapezoid seen from behind the goal with cut-out
// stickers standing on it, which is a good drawing of a different game. The
// trial won: every pitch in the app is drawn here and the trapezoid it beat
// keeps only the lineup planner.
//
// This is the ground half. The markers are `PitchMarker`, and they are the
// club's KIT on a translucent wash under Championship Manager's own bevelled
// plate — the plate is the game's, the kit is not. CM had a shirt number to put
// on its discs and we do not draw one: FPL's `squad_number` is null on every
// element, the sister repo's collides inside a club on 13 of 20 predicted
// elevens, and Craig took the number off the shirt on 10 Sep 2026 in any case.
// The name on the plate does that work.
//
// **No hoardings and no crest.** They belong to the photograph the other pitch
// is; this is a diagram, and a diagram with advertising on it is a diagram
// pretending to be a stand.
//
// Markings are strokes on a viewBox that stretches, and every one is
// `non-scaling-stroke`, because the number of rows is
// whatever the commissioner defined, so a tall pitch would otherwise draw
// hairlines across it and cables down it.

/** **The WHOLE pitch, in metres** (Craig, 2 Sep: "CM uses a full pitch"). This
 *  drew a half — one penalty area, the halfway line along the top edge — and
 *  that is the single thing most responsible for ours not reading as CM's:
 *  `cm9900/19.jpg` and the 01/02 shots all draw both boxes, both halves, and the
 *  centre circle in the MIDDLE of the picture. A team standing in one half of a
 *  full pitch is a formation; a team filling a half-pitch is a diagram of rows.
 *
 *  Metres rather than fractions so the markings sit where a real pitch puts them
 *  rather than where they look right. */
const WIDTH_M = 68;
const LENGTH_M = 105;

/** The penalty area and the six-yard box, in metres, from the goal line. */
const BOX = { width: 40.32, depth: 16.5 };
const SIX = { width: 18.32, depth: 5.5 };
const CENTRE_CIRCLE_M = 9.15;
const PENALTY_SPOT_M = 11;

/** Half the chord where the penalty arc crosses the box line, as a percentage of
 *  the pitch's width. The arc is a 9.15m circle round the spot; the box line is
 *  16.5m out and the spot 11m, so the arc is 5.5m from centre there and its
 *  half-width is the other side of that right triangle. */
const ARC_HALF =
  (Math.sqrt(CENTRE_CIRCLE_M ** 2 - (BOX.depth - PENALTY_SPOT_M) ** 2) / WIDTH_M) * 100;

const pct = (m: number, of: number) => (m / of) * 100;

export default function CmGround({
  children,
  /** Fill the column rather than bleeding through the page's gutters.
   *
   *  **For a pitch standing BESIDE something.** Bleeding is right when the pitch
   *  is the widest thing on the screen and gains from every pixel; it is wrong
   *  in a two-column layout, where the pitch would run out under the list. The
   *  squad screen sets this and the head-to-head does not. */
  inColumn = false,
}: {
  children: ReactNode;
  inColumn?: boolean;
}) {
  return (
    <div className={`pitch bg-pitch-turf ${inColumn ? "" : "bleed"}`}>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Stripes down the pitch, as a groundsman cuts one and as the shot
            shows. Texture rather than structure: narrow enough that no band
            edge lands where a line of players stands. */}
        {[1, 3, 5, 7, 9].map((band) => (
          <rect
            key={band}
            x={band * 10}
            y="0"
            width="10"
            height="100"
            fill="var(--color-pitch-mow)"
          />
        ))}

        {/* **Hairlines** (Craig: "lines too thick, hard to read"). The reference
            draws its markings about one pixel on an 800px canvas — they are the
            faintest thing on the screen and the players sit on top of them.
            Ours were 1.5px at 75% and competed with the names. */}
        <g
          fill="none"
          stroke="var(--color-pitch-line)"
          strokeOpacity="0.30"
          strokeWidth="0.75"
          vectorEffect="non-scaling-stroke"
        >
          {/* The full pitch: touchlines, a box and a six-yard box at EACH end,
              the halfway line across the middle with the centre circle on it.
              The team stands in the bottom half, attacking up the page. */}
          <rect x="0.5" y="0.5" width="99" height="99" />

          {/* His own end, at the foot. */}
          <rect
            x={50 - pct(BOX.width, WIDTH_M) / 2}
            y={100 - pct(BOX.depth, LENGTH_M)}
            width={pct(BOX.width, WIDTH_M)}
            height={pct(BOX.depth, LENGTH_M)}
          />
          <rect
            x={50 - pct(SIX.width, WIDTH_M) / 2}
            y={100 - pct(SIX.depth, LENGTH_M)}
            width={pct(SIX.width, WIDTH_M)}
            height={pct(SIX.depth, LENGTH_M)}
          />

          {/* The end he is attacking, at the head. */}
          <rect
            x={50 - pct(BOX.width, WIDTH_M) / 2}
            y="0"
            width={pct(BOX.width, WIDTH_M)}
            height={pct(BOX.depth, LENGTH_M)}
          />
          <rect
            x={50 - pct(SIX.width, WIDTH_M) / 2}
            y="0"
            width={pct(SIX.width, WIDTH_M)}
            height={pct(SIX.depth, LENGTH_M)}
          />

          {/* **The D outside each box** (Craig, 2 Sep: "both boxes on the pitch
              are missing the circle"). It was dropped when the pitch was a half
              — an unclipped ellipse put a semicircle INSIDE the penalty area,
              which is a marking no pitch has — and an arc is the honest way to
              draw it rather than the reason to leave it out.

              Computed, not eyeballed: the arc is 9.15m from the spot, the spot
              is 11m from the goal line and the box line is 16.5m, so the arc
              crosses that line 7.31m either side of centre — 10.75% of a 68m
              width. `A rx ry 0 0 1` sweeps the short way between those points,
              which is the part outside the box. */}
          <path
            d={`M ${50 - ARC_HALF} ${100 - pct(BOX.depth, LENGTH_M)}
                A ${pct(CENTRE_CIRCLE_M, WIDTH_M)} ${pct(CENTRE_CIRCLE_M, LENGTH_M)} 0 0 1
                  ${50 + ARC_HALF} ${100 - pct(BOX.depth, LENGTH_M)}`}
          />
          <path
            d={`M ${50 - ARC_HALF} ${pct(BOX.depth, LENGTH_M)}
                A ${pct(CENTRE_CIRCLE_M, WIDTH_M)} ${pct(CENTRE_CIRCLE_M, LENGTH_M)} 0 0 0
                  ${50 + ARC_HALF} ${pct(BOX.depth, LENGTH_M)}`}
          />

          <line x1="0.5" y1="50" x2="99.5" y2="50" />
          {/* An ellipse and not a circle: the viewBox is stretched to whatever
              box the frame is, so a circle would come out an ellipse anyway and
              drawing it as one keeps the radius honest in both axes. */}
          <ellipse
            cx="50"
            cy="50"
            rx={pct(CENTRE_CIRCLE_M, WIDTH_M)}
            ry={pct(CENTRE_CIRCLE_M, LENGTH_M)}
          />
        </g>
      </svg>

      {/* **The keeper stands at the head, and no reversing happens here.** This
          carried `flex-col-reverse` once and it was the wrong PLACE for it: only
          the flat ground reversed, so the two pitches this app draws disagreed
          about which way the team was kicking. `PitchRows` owns the direction for
          all six now, and it draws the lines in the order it is given — which is
          keeper-first, the order the squad is grouped in and the order the list
          beside it prints (Craig, 10 Sep 2026: "currently we go strikers at top,
          keeper bottom, lets reverse this").

          **`absolute inset-0`, so the lines live INSIDE the shape** rather than
          setting it: the pitch's `aspect-ratio` is the frame and the rows fill
          it, which is what stops the two fighting over the height.

          **The padding positions the side, and it flipped with the direction.**
          It leaves the attacking end empty, as `19.jpg` does, and squeezes the
          block toward the keeper — who is pinned to his own goal line by the
          near-zero padding at the END HE IS ON. That end is the head now, so the
          reserved band is at the foot; left where it was it would have held the
          keeper a sixth of a pitch off his line and pushed the forwards through
          the far goal. `justify-between` shares out what is left.

          **7% and not 16%** (Craig, 10 Sep 2026: *"the strikers could be a
          little lower"*). 16% was the figure the pitch was tuned to while it
          was drawn the other way up, and inherited without being re-measured
          when the side turned round: it left a fifth of the grass empty under
          the front line and pulled the whole shape up into its own half. */}
      <div className="absolute inset-0 z-base flex flex-col justify-between px-2 pb-[7%] pt-1">
        {children}
      </div>
    </div>
  );
}
