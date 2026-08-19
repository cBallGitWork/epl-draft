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

/** How far in from each side the goal line sits, as a percentage of the frame.
 *
 *  A picture decision, learned by getting it wrong three times. It was 11 — a
 *  goal line at 78% of the near width — and that is steeper than FPL's own app,
 *  which is barely angled at all. Two things went wrong at that angle and only
 *  one of them was taste: a back five had to stand on a line 22% narrower than
 *  the one the forwards stand on, and the row padding that keeps a line on the
 *  grass is a single figure for the whole column, so either the near rows gave
 *  up width they had or the far row stood off the pitch. It stood off the pitch.
 *
 *  At 10% the goal line is 90% of the near width, the far row sits inside the
 *  touchlines at the padding the near rows already wanted, and the perspective
 *  still reads as perspective.
 *
 *  And it runs the whole depth as ONE straight taper. The version before this
 *  finished splaying at 38% and ran square from there, on the theory that the
 *  near rows want the full width. What that actually draws is a touchline
 *  heading outward in perspective which then stops dead halfway down, and an eye
 *  still following the line reads the stop as the pitch turning back in. A
 *  perspective line has to keep going until it leaves the frame.
 *
 *  Exported because the hoardings stand behind the far goal line and have to be
 *  exactly as wide as the pitch is at that depth. `PitchFrame` hands it to the
 *  stylesheet — the number used to be written out again in the CSS with a
 *  comment asking the next person to keep the two in step. */
export const FAR_INSET = 5;

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

/** Half the frame's width at a given depth: 39 at the goal line, 50 where the
 *  picture is cut off. */
function halfWidth(y: number): number {
  return 50 - FAR_INSET * (1 - y / 100);
}

/** Where the grass ends at a given depth. */
const leftEdge = (y: number) => 50 - halfWidth(y);
const rightEdge = (y: number) => 50 + halfWidth(y);

/** How much grass lies outside the painted line, as a share of the pitch's own
 *  width at that depth, and how far down the goal line sits.
 *
 *  Without them the touchline IS the edge of the picture, which reads as a
 *  border drawn around a pitch rather than a line painted on one — there is
 *  always grass beyond a touchline. A share and not a fixed number of frame
 *  units, because the frame narrows toward the far end: a constant gap is 5% of
 *  the pitch down here and 6.4% up there, and the lines visibly stop tracking
 *  the grass they are supposed to run parallel to. */
const MARGIN = 0.05;
const GOAL_LINE = 2;

/** The touchlines themselves. */
const insideLeft = (y: number) => leftEdge(y) + halfWidth(y) * MARGIN;
const insideRight = (y: number) => rightEdge(y) - halfWidth(y) * MARGIN;

/** A run of points into a path, `M` then `L`s. */
const trace = (points: string[]) => `M ${points[0]} L ${points.slice(1).join(" L ")}`;

/** The x of a point `metres` either side of the centre line, at depth `y`.
 *  Positive is right of centre. Splayed with the touchlines, so a line that is
 *  straight on grass is a slope here. */
function across(y: number, metres: number): number {
  return 50 + (halfWidth(y) * 2 * (metres / WIDTH_M)) * MARKING_SCALE;
}

/** The boxes are drawn wider and shallower than their true shape.
 *
 *  Correctly proportioned at this marking scale they come out as deep narrow
 *  slots — right on paper, wrong in a picture whose depth is already
 *  foreshortened by the splay. Two named factors rather than fudged
 *  coordinates, so the arithmetic below stays readable as arithmetic.
 *
 *  Both moved back toward 1 when the taper softened, because both were paying
 *  for the taper: a gentler splay foreshortens less, so the correction it needed
 *  is smaller. Left where they were, the penalty area came out wider than the
 *  eighteen-yard box has any business being on a goal line that is now nearly
 *  the full width of the frame. */
const BOX_STRETCH = 1.25;
const BOX_FLATTEN = 0.85;

/** A box open along the goal line, which is where the turf's own line already
 *  is: penalty area and six-yard box are the same shape at two sizes. */
function box(widthM: number, depthM: number): string {
  const back = GOAL_LINE + depth(depthM) * BOX_FLATTEN;
  const half = (widthM / 2) * BOX_STRETCH;
  return [
    `M ${across(GOAL_LINE, -half)},${GOAL_LINE}`,
    `L ${across(back, -half)},${back}`,
    `L ${across(back, half)},${back}`,
    `L ${across(GOAL_LINE, half)},${GOAL_LINE}`,
  ].join(" ");
}

/** An arc bulging toward the reader, as a quadratic through its own apex — the
 *  D outside the penalty area. */
function arc(y: number, radiusM: number, bulge: number): string {
  const half = across(y, radiusM * BOX_STRETCH) - 50;
  return `M ${50 - half},${y} Q 50,${y + bulge * 2} ${50 + half},${y}`;
}

const PENALTY_AREA_M = 40.3;
const PENALTY_AREA_DEPTH_M = 16.5;
const SIX_YARD_M = 18.32;
const SIX_YARD_DEPTH_M = 5.5;
const PENALTY_SPOT_M = 11;
const ARC_RADIUS_M = 9.15;

/** Where the halfway line is drawn, which is NOT where the arithmetic puts it.
 *  At marking scale the true line lands at 50, straight through the midfield
 *  row. This keeps the depth it is there to give without crowding anybody. */
const HALFWAY_DEPTH = 62;

/** A real corner arc is one metre and invisible here. Drawn at the smallest
 *  radius that still reads as a corner. */
const CORNER_ARC_M = 4.5;

const PENALTY_AREA_BACK = GOAL_LINE + depth(PENALTY_AREA_DEPTH_M) * BOX_FLATTEN;
const CORNER_INSET = across(GOAL_LINE, CORNER_ARC_M) - 50;
const CORNER_DEPTH = GOAL_LINE + depth(CORNER_ARC_M);

/** The grass, which runs to the edge of the frame — the full-depth band. */
const TURF = band(0, 100);

/** Where each mow band ends, as a percentage of the frame's depth. FPL's own
 *  four, converted from their 788-unit viewBox: they GROW toward the reader
 *  rather than fading, and that is what sells the angle. */
const BANDS = [9.3, 17.4, 25.5, 33.6, 44.5, 55.4, 65, 81.7, 100];

/** One mow band as its own trapezoid, cut to the touchlines by construction.
 *  Deliberately not a clipped rectangle: a `clipPath` needs a document-unique id
 *  and this component can appear more than once on a page. */
function band(from: number, to: number): string {
  return `${trace([
    `${rightEdge(from)},${from}`,
    `${rightEdge(to)},${to}`,
    `${leftEdge(to)},${to}`,
    `${leftEdge(from)},${from}`,
  ])} Z`;
}

/** Everything painted on the grass.
 *
 *  The touchlines run off the near edge of the frame rather than closing across
 *  it. That edge is a crop, not the end of a pitch, and a line along it would be
 *  the border this drawing deliberately does not have. */
const MARKINGS = [
  // Up one touchline, along the goal line, and back down the other. Both sides
  // run off the near edge of the frame rather than closing across it: that edge
  // is a crop, not the end of a pitch.
  trace([
    `${insideLeft(100)},100`,
    `${insideLeft(GOAL_LINE)},${GOAL_LINE}`,
    `${insideRight(GOAL_LINE)},${GOAL_LINE}`,
    `${insideRight(100)},100`,
  ]),
  box(PENALTY_AREA_M, PENALTY_AREA_DEPTH_M),
  box(SIX_YARD_M, SIX_YARD_DEPTH_M),
  // The D, bulging out of the penalty area around the spot. It clears the box by
  // whatever the arc has left after the spot's own distance from the goal line.
  arc(
    PENALTY_AREA_BACK,
    ARC_RADIUS_M,
    depth(ARC_RADIUS_M - (PENALTY_AREA_DEPTH_M - PENALTY_SPOT_M)) * BOX_FLATTEN,
  ),
  // The halfway line, touchline to touchline. It does cross a row of stickers,
  // and that is what it does in FPL's graphic and on a Saturday: at 45% opacity
  // a player standing on the halfway line reads as a player standing on it.
  `M ${insideLeft(HALFWAY_DEPTH)},${HALFWAY_DEPTH} L ${insideRight(HALFWAY_DEPTH)},${HALFWAY_DEPTH}`,
  // Corner arcs, where the goal line meets each touchline. Only two of them: the
  // near end of this picture is a crop, and a crop has no corners.
  `M ${insideLeft(GOAL_LINE) + CORNER_INSET},${GOAL_LINE} A ${CORNER_INSET} ${CORNER_DEPTH - GOAL_LINE} 0 0 1 ${insideLeft(CORNER_DEPTH)},${CORNER_DEPTH}`,
  `M ${insideRight(GOAL_LINE) - CORNER_INSET},${GOAL_LINE} A ${CORNER_INSET} ${CORNER_DEPTH - GOAL_LINE} 0 0 0 ${insideRight(CORNER_DEPTH)},${CORNER_DEPTH}`,
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
            rx={across(HALFWAY_DEPTH, ARC_RADIUS_M * BOX_STRETCH) - 50}
            ry={depth(ARC_RADIUS_M) / 2}
            vectorEffect="non-scaling-stroke"
          />
          {/* The penalty spot. */}
          <ellipse
            cx="50"
            cy={GOAL_LINE + depth(PENALTY_SPOT_M) * BOX_FLATTEN}
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
