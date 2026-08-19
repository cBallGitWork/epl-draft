// The grass, in perspective. Drawn rather than styled, because the shape is a
// trapezoid and the bands inside it have to follow that trapezoid — which a
// background gradient cannot do.
//
// Every coordinate below is derived from two decisions about the picture and the
// real dimensions of a football pitch. Nothing is a measured-by-eye path string:
// the first version of this file was fourteen of them, and every request to move
// one line meant re-deriving the other four by hand.
//
// Stretched to whatever box it is given — the number of rows on a pitch is
// however many positions the commissioner defined — so every stroke is
// non-scaling. Without that, a tall pitch draws hairlines across and cables down.

/** A real pitch, in metres. The frame shows one half, seen from behind the goal. */
const WIDTH_M = 68;
const HALF_LENGTH_M = 52.5;

/** How far in from each side the goal line sits, and the depth by which the
 *  touchlines have splayed out to the full width of the frame.
 *
 *  Both are picture decisions, and both were learned by getting them wrong. The
 *  splay is gentle — 78% of the width at the goal line — because a steeper one
 *  reads as a funnel: the far line has nowhere to stand two centre halves and
 *  every marking inside it crowds toward the middle. And it *finishes* at 38% of
 *  the depth rather than running to the bottom, which is what FPL's own graphic
 *  does. A trapezoid that keeps opening all the way down spends its widest, most
 *  useful rows off the edge of the grass. */
const FAR_INSET = 11;
const SPLAY_END = 38;

/** Markings at half their true size.
 *
 *  At full size the penalty area is a correct drawing that swallows the top
 *  third of the frame and puts a white line through the defenders; FPL draw
 *  theirs small for the same reason. The frame is a backdrop for fifteen
 *  stickers, and the markings are there to say "this is a pitch", not to be
 *  measured. */
const MARKING_SCALE = 0.5;

/** Depth of a distance up the pitch, as a percentage of the frame. */
function depth(metres: number): number {
  return (metres / HALF_LENGTH_M) * 100 * MARKING_SCALE;
}

/** Half the frame's width at a given depth: 39 at the goal line, 50 once the
 *  touchlines have finished opening. */
function halfWidth(y: number): number {
  return y >= SPLAY_END ? 50 : 50 - FAR_INSET * (1 - y / SPLAY_END);
}

/** The touchlines themselves, at a given depth. */
const leftEdge = (y: number) => 50 - halfWidth(y);
const rightEdge = (y: number) => 50 + halfWidth(y);

/** The x of a point `metres` either side of the centre line, at depth `y`.
 *  Positive is right of centre. Splayed with the touchlines, so a line that is
 *  straight on grass is a slope here. */
function across(y: number, metres: number): number {
  return 50 + (halfWidth(y) * 2 * (metres / WIDTH_M)) * MARKING_SCALE;
}

/** A box open along the goal line, which is where the turf's own edge already
 *  is: penalty area and six-yard box are the same shape at two sizes.
 *
 *  `stretch` widens the penalty area by a quarter. At its true share of a
 *  half-scale set it reads as a narrow slot rather than as the box a keeper
 *  comes for crosses in — the one place the drawing knowingly leaves the
 *  arithmetic, so it is a named argument rather than a fudged coordinate. */
function box(widthM: number, depthM: number, stretch = 1): string {
  const back = depth(depthM);
  const half = (widthM / 2) * stretch;
  return [
    `M ${across(0, -half)},0`,
    `L ${across(back, -half)},${back}`,
    `L ${across(back, half)},${back}`,
    `L ${across(0, half)},0`,
  ].join(" ");
}

/** An arc bulging toward the reader, as a quadratic through its own apex — the
 *  D outside the penalty area and the centre circle at the halfway line. */
function arc(y: number, radiusM: number, bulge: number): string {
  const half = across(y, radiusM / 2) - 50;
  return `M ${50 - half},${y} Q 50,${y + bulge * 2} ${50 + half},${y}`;
}

const PENALTY_AREA_M = 40.3;
const PENALTY_AREA_DEPTH_M = 16.5;
const SIX_YARD_M = 18.32;
const SIX_YARD_DEPTH_M = 5.5;
const PENALTY_SPOT_M = 11;
const ARC_RADIUS_M = 9.15;

/** Where the halfway line is drawn, which is NOT where the arithmetic puts it.
 *  At marking scale the true halfway line lands at 50, straight through the
 *  midfield row. Three quarters down keeps the depth it is there to give without
 *  crowding anybody. */
const HALFWAY_DEPTH = 75;

/** A real corner arc is one metre and invisible here. Drawn at the smallest
 *  radius that still reads as a corner. */
const CORNER_ARC_M = 4.5;

const PENALTY_AREA_BACK = depth(PENALTY_AREA_DEPTH_M);
const CORNER_INSET = across(0, CORNER_ARC_M) - 50;
const CORNER_DEPTH = depth(CORNER_ARC_M);

/** The playing surface. */
const TURF = [
  `M ${leftEdge(0)},0`,
  `L ${rightEdge(0)},0`,
  `L ${rightEdge(SPLAY_END)},${SPLAY_END}`,
  `L ${rightEdge(100)},100 L ${leftEdge(100)},100`,
  `L ${leftEdge(SPLAY_END)},${SPLAY_END} Z`,
].join(" ");

/** Where each mow band ends, as a percentage of the frame's depth. FPL's own
 *  four, converted from their 788-unit viewBox: they GROW toward the reader
 *  rather than fading, and that is what sells the angle. */
const BANDS = [9.3, 17.4, 25.5, 33.6, 44.5, 55.4, 65, 81.7, 100];

/** One mow band as its own trapezoid, cut to the touchlines by construction.
 *  Deliberately not a clipped rectangle: a `clipPath` needs a document-unique id
 *  and this component can appear more than once on a page. */
function band(from: number, to: number): string {
  return [
    `M ${leftEdge(from)},${from}`,
    `L ${rightEdge(from)},${from}`,
    `L ${rightEdge(to)},${to}`,
    `L ${leftEdge(to)},${to} Z`,
  ].join(" ");
}

/** Everything painted inside the touchlines. There is deliberately no outline
 *  around the pitch itself: the turf already has an edge where the grass stops,
 *  and a stroke tracing it read as a border drawn around a picture of a pitch. */
const MARKINGS = [
  box(PENALTY_AREA_M, PENALTY_AREA_DEPTH_M, 1.25),
  box(SIX_YARD_M, SIX_YARD_DEPTH_M),
  // The D, bulging out of the penalty area around the spot. It clears the box by
  // whatever the arc has left after the spot's own distance from the goal line.
  arc(PENALTY_AREA_BACK, ARC_RADIUS_M, depth(ARC_RADIUS_M - (PENALTY_AREA_DEPTH_M - PENALTY_SPOT_M))),
  // The halfway line. It does cross a row of stickers, and that is what it does
  // in FPL's graphic and on a Saturday: at 45% opacity a player standing on the
  // halfway line reads as a player standing on the halfway line.
  `M 0,${HALFWAY_DEPTH} L 100,${HALFWAY_DEPTH}`,
  // Corner arcs, where the goal line meets each touchline. Only two of them: the
  // near end of this picture is the halfway line, and a halfway line has no
  // corners.
  `M ${FAR_INSET + CORNER_INSET},0 A ${CORNER_INSET} ${CORNER_DEPTH} 0 0 1 ${leftEdge(CORNER_DEPTH)},${CORNER_DEPTH}`,
  `M ${100 - FAR_INSET - CORNER_INSET},0 A ${CORNER_INSET} ${CORNER_DEPTH} 0 0 0 ${rightEdge(CORNER_DEPTH)},${CORNER_DEPTH}`,
];

export default function PitchTurf() {
  return (
    // The positioning is on a wrapper and not on the svg itself. An svg is a
    // replaced element: given `top` and `bottom` it does NOT stretch between
    // them, it takes its height from its own aspect ratio — so a square viewBox
    // drew a square, the grass stopped short, and the forwards stood on the
    // surround. A div stretches; the svg then fills it.
    //
    // Below the hoardings, never over them: the far touchline is the foot of the
    // boards, which is where a goal line actually is.
    <div className="absolute inset-x-0 bottom-0 top-[var(--pitch-boards)]">
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <path d={TURF} fill="var(--color-pitch-turf)" />
        {BANDS.map((end, index) =>
          index % 2 === 0 ? (
            <path key={end} d={band(BANDS[index - 1] ?? 0, end)} fill="var(--color-pitch-mow)" />
          ) : null,
        )}

        {/* One stroke setting for all of it: on a real pitch every line is
            painted the same width. */}
        <g
          fill="none"
          stroke="var(--color-pitch-line)"
          strokeOpacity="0.45"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        >
          {MARKINGS.map((marking) => (
            <path key={marking} d={marking} vectorEffect="non-scaling-stroke" />
          ))}
          {/* The centre circle, straddling the halfway line. Its depth radius is
              halved against its width radius because the frame is stretched: one
              viewBox unit is about twice as tall as it is wide on a phone, so
              equal radii would draw an egg. */}
          <ellipse
            cx="50"
            cy={HALFWAY_DEPTH}
            rx={across(HALFWAY_DEPTH, ARC_RADIUS_M) - 50}
            ry={depth(ARC_RADIUS_M) / 2}
            vectorEffect="non-scaling-stroke"
          />
          {/* The penalty spot. */}
          <ellipse
            cx="50"
            cy={depth(PENALTY_SPOT_M)}
            rx="0.6"
            ry="0.6"
            fill="var(--color-pitch-line)"
            fillOpacity="0.45"
          />
        </g>
      </svg>
    </div>
  );
}
