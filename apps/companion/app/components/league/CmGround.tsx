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

/** The half a squad screen shows, in metres, so the markings sit where a real
 *  pitch puts them rather than where they look right. Same two numbers
 *  `PitchTurf` derives its trapezoid from. */
const WIDTH_M = 68;
const HALF_LENGTH_M = 52.5;

/** The penalty area and the six-yard box, in metres, from the goal line. */
const BOX = { width: 40.32, depth: 16.5 };
const SIX = { width: 18.32, depth: 5.5 };
const CENTRE_CIRCLE_M = 9.15;

const pct = (m: number, of: number) => (m / of) * 100;

export default function CmGround({ children }: { children: ReactNode }) {
  return (
    // Out through the page's own gutters, like the other pitch: it is the widest
    // thing on the screen and the only one that gains from every pixel.
    <div className="pitch bleed bg-pitch-turf">
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Mown bands across the pitch rather than along it, which is how a
            groundsman cuts one. Eight over the half, so a band is about six
            metres — a mower's width rather than a quarter of the pitch. */}
        {[1, 3, 5, 7].map((band) => (
          <rect
            key={band}
            x="0"
            y={band * 12.5}
            width="100"
            height="12.5"
            fill="var(--color-pitch-mow)"
          />
        ))}

        <g
          fill="none"
          stroke="var(--color-pitch-line)"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        >
          {/* **The goal line is at the TOP**, because the keeper is the first
              row a squad draws and the rows run down the page from him. Drawn
              the other way up first, which put the penalty area round the
              forwards and the centre circle round the goalkeeper.

              The touchlines, then the penalty area and the six-yard box hanging
              off the goal line, then the halfway line at the foot with the
              centre circle's arc on it. */}
          <rect x="1" y="1" width="98" height="98" />
          <rect
            x={50 - pct(BOX.width, WIDTH_M) / 2}
            y="1"
            width={pct(BOX.width, WIDTH_M)}
            height={pct(BOX.depth, HALF_LENGTH_M)}
          />
          <rect
            x={50 - pct(SIX.width, WIDTH_M) / 2}
            y="1"
            width={pct(SIX.width, WIDTH_M)}
            height={pct(SIX.depth, HALF_LENGTH_M)}
          />
          {/* An ellipse and not a circle: the viewBox is stretched to whatever
              box the frame is, so a circle would come out an ellipse anyway and
              drawing it as one keeps the radius honest in both axes. */}
          <ellipse
            cx="50"
            cy="99"
            rx={pct(CENTRE_CIRCLE_M, WIDTH_M)}
            ry={pct(CENTRE_CIRCLE_M, HALF_LENGTH_M)}
          />
        </g>
      </svg>

      {/* The lines of players, over the markings. `pb` clears the goal line so a
          keeper does not stand on it. */}
      <div className="relative z-base flex flex-col gap-3 px-2 pb-4 pt-3">
        {children}
      </div>
    </div>
  );
}
