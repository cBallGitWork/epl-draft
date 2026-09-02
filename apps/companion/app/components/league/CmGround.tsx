import type { ReactNode } from "react";

// Championship Manager's pitch: flat, seen from directly above, drawn in lines.
//
// **A trial** (Craig, 31 Aug): "pitch view doesn't really fit in with CM".
// `cm9900/19.jpg` is why he is right. The game's tactics screen puts the squad
// list down the left and, beside it, a plain green rectangle with white markings
// and numbered discs on it — no perspective, no photographs, no name plates. Our
// pitch is FPL's: a trapezoid seen from behind the goal, with cut-out stickers
// standing on it. It is a good drawing of a different game.
//
// This is the ground half of the trial. The markers are `PitchDisc`, and they
// are cut-out heads rather than CM's numbers, because we have no shirt numbers
// to draw — FPL's `squad_number` is a key that is null on every element, which
// `CLAUDE.md` records — and because a face is the one thing sixteen managers can
// read at 24px without being told.
//
// **No hoardings and no crest.** They belong to the photograph the other pitch
// is; this is a diagram, and a diagram with advertising on it is a diagram
// pretending to be a stand.
//
// Markings are strokes on a viewBox that stretches, and every one is
// `non-scaling-stroke` for the reason `PitchTurf` gives: the number of rows is
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

      {/* **`flex-col-reverse`, so the keeper stands at the foot.** The lines
          arrive keeper-first — that is the order the squad is grouped in and the
          order the list prints — and a pitch drawn top-down from that order puts
          the goalkeeper in the attacking third. Reversing here rather than at
          the join keeps one ordering in the data and lets each view draw it the
          way that view reads.

          `justify-end` with a generous gap: the Milan shot spends most of its
          height on the space BETWEEN lines, which is what makes a formation look
          like a shape rather than like a list with pictures. */}
      {/* **The team stands in its own half and a bit**, not across the whole
          picture. `19.jpg` puts Everton's back four just above their own box and
          the front three around the halfway line, leaving the top third of the
          pitch empty — which is what makes it read as a team on a pitch rather
          than as rows filling a rectangle.

          `justify-between` inside a padded box rather than `justify-end` with a
          gap: the lines then SPREAD to fill the space they are given, which is
          what stops the keeper being stranded a third of a pitch from his back
          line while the outfield bunches. The padding is what leaves the
          attacking end empty. */}
      {/* **`absolute inset-0`, so the lines live INSIDE the shape** rather than
          setting it. The pitch's `aspect-ratio` is the frame; the rows fill it
          and share out whatever height that leaves, which is what stops the two
          fighting — and the fight is what produced a 3.17 ratio and a keeper
          off the bottom of the screen.

          `pt-[28%]` is the empty attacking third `19.jpg` leaves above the front
          line; `justify-between` spreads the rest, so the keeper sits on his own
          goal line rather than a third of a pitch above it. */}
      <div className="absolute inset-0 z-base flex flex-col-reverse justify-between px-2 pb-2 pt-[28%]">
        {children}
      </div>
    </div>
  );
}
