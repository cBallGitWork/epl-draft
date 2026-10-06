import type { ReactNode } from "react";

// Championship Manager's pitch: flat, seen from above, drawn in lines; the markers are `PitchMarker`.
// Every marking is `non-scaling-stroke`: the viewBox stretches to however many rows the commissioner defined.

/** The whole pitch, in metres, so the markings sit where a real pitch puts them. */
const WIDTH_M = 68;
const LENGTH_M = 105;

/** The penalty area and the six-yard box, in metres, from the goal line. */
const BOX = { width: 40.32, depth: 16.5 };
const SIX = { width: 18.32, depth: 5.5 };
const CENTRE_CIRCLE_M = 9.15;
const PENALTY_SPOT_M = 11;

/** Half the chord where the penalty arc crosses the box line, as a percentage of the pitch's width. */
const ARC_HALF =
  (Math.sqrt(CENTRE_CIRCLE_M ** 2 - (BOX.depth - PENALTY_SPOT_M) ** 2) / WIDTH_M) * 100;

const pct = (m: number, of: number) => (m / of) * 100;

export default function CmGround({
  children,
  /** Fill the column rather than bleeding through the page's gutters: for a pitch
   *  beside something. The head-to-head's desk pair gets the same from `.pitch-pair`. */
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
        {/* Mown stripes, narrow enough that no band edge lands where a line of players stands. */}
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

        {/* Hairlines: the markings are the faintest thing on the ground, so they never compete with the names. */}
        <g
          fill="none"
          stroke="var(--color-pitch-line)"
          strokeOpacity="0.30"
          strokeWidth="0.75"
          vectorEffect="non-scaling-stroke"
        >
          {/* The full pitch: both boxes, the halfway line and the centre circle. */}
          <rect x="0.5" y="0.5" width="99" height="99" />

          {/* The boxes at the foot. */}
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

          {/* The boxes at the head. */}
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

          {/* The D outside each box: an arc sweeping the short way between the chord's ends. */}
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
          {/* An ellipse: the viewBox stretches, so this keeps the radius true in both axes. */}
          <ellipse
            cx="50"
            cy="50"
            rx={pct(CENTRE_CIRCLE_M, WIDTH_M)}
            ry={pct(CENTRE_CIRCLE_M, LENGTH_M)}
          />
        </g>
      </svg>

      {/* No reversing here: `PitchRows` owns the direction, keeper at the head. `absolute inset-0` so the
          rows fill the pitch's `aspect-ratio` frame rather than set it; the near-zero top padding pins the
          keeper to his line, and the band at the foot keeps the forwards off the far goal. */}
      <div className="absolute inset-0 z-base flex flex-col justify-between px-2 pb-[7%] pt-1">
        {children}
      </div>
    </div>
  );
}
