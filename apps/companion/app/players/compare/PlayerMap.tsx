import type { Touch } from "@epl/core";
import { CELL, heatCells, shade } from "./heat";

// One man's pitch, shaded where he played.
//
// **A pitch each, and not two halves of one.** The old map put both men on one
// pitch attacking opposite ways, which was right when each had a single dot —
// two dots on one pitch cannot collide if they are kept to their own halves. It
// is wrong for a density field: halving the axis squeezes a striker's whole map
// into the space between the halfway line and one goal, and what comes out is a
// smear rather than a shape. The reference does both and its per-player maps are
// the ones you can read. So: one pitch each, both running the same way, side by
// side on a desk and stacked under a thumb.
//
// **The smoothing is a Gaussian blur over small cells**, which is the whole
// answer to Craig's *"heatmaps are rough squares"*. `heat.ts` carries why a
// finer grid would not have worked. Done as an SVG filter rather than a canvas
// so the map is server-rendered like everything else on the desk — no client
// component, no hydration, and it survives being printed.
//
// **A warm ramp, and NOT the club's colour.** The first cut shaded each map in
// its man's club colour, on the reasoning that the bar above already codes them
// that way. Two things were wrong with it and both were visible the moment it
// was drawn. Manchester City's sky blue on green turf is very nearly nothing —
// the map was legible for Chelsea and blank for City, which is a picture whose
// readability depends on who is in it. And the colour was doing no work anyway:
// these are SEPARATE pitches with the man's name over each, so identity is
// carried by the caption and the club colour was spending the one visual channel
// a density map has on a fact already stated.
//
// So density gets the channel, through a ramp that reads on grass at every
// intensity — which is what the reference uses and for the same reason.
//
// **This is a new object in the palette and it needs a DESIGN.md ruling.** §3
// makes every colour a slot with one meaning, and `--color-hot`/`--color-cold`
// are deliberately a THRESHOLD rather than a scale — "a cell is lit or it is
// not; there is no second strength" — confined to a board of many measures. A
// density ramp is by definition a scale, so it cannot wear them, and it is the
// first sequential ramp in the app. It is kept local to the pitch on purpose:
// it shades a colour PLATE (DESIGN §5's own category, where the pitch and the
// crest already live) and never ink, never a cell, never a control.

/** The pitch, in the units its markings are drawn in. Landscape, because a map
 *  is read along the direction of play — and deliberately not `.pitch`, which is
 *  the squad pitch's PORTRAIT frame and left 284px of dead grass under a
 *  landscape map, measured. */
const BOX = { width: 100, height: 64 };

/** How far the blur reaches, in pitch units.
 *
 *  A shade over half a cell (`heat.ts` draws them 4.17 x 4.00), so one touch
 *  spreads to about the area a player actually controls and two touches a cell
 *  apart merge into one shape. Larger and every map becomes the same fog; smaller
 *  and the cell edges come back, which is the fault being fixed. */
const BLUR = 2.0;

/** The ramp, coldest first, as it is laid over grass.
 *
 *  Yellow through orange to red: the order reads as intensity without a key,
 *  which is the only reason a ramp is allowed to carry meaning at all here.
 *  Written out literally rather than composed, because Tailwind v4 drops a theme
 *  variable whose name never appears in scanned source — and because these are
 *  SVG `fill` values, which never pass through Tailwind at all. */
const RAMP = ["#f2e05a", "#f0a93c", "#e2622c", "#c8281c"] as const;

/** How far the density curve and the blur are tuned against each other lives in
 *  `heat.ts` beside `shade`, because it is arithmetic with a test rather than a
 *  drawing decision. Change one of the two and re-read a map. */

export default function PlayerMap({
  name,
  touches,
  matches,
  id,
}: {
  name: string;
  touches: readonly Touch[];
  /** How many fixtures the points came from, for the caption. */
  matches: number;
  /** Unique per pitch on the page — two maps share a document and an SVG filter
   *  id is global to it. Two `id="heat"` and the second man is drawn with the
   *  first man's filter, which is a real map of the wrong shape. */
  id: string;
}) {
  const cells = heatCells(touches);

  return (
    <figure className="flex min-w-0 flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-2xs">
        <span className="min-w-0 truncate font-bold uppercase">{name}</span>
        {/* Volume, in words, because the pitch above deliberately does not carry
            it — every map is normalised to its own busiest cell so that a man
            with fewer touches shows a SHAPE rather than a blank. */}
        <span className="shrink-0 text-faint">
          {touches.length === 0
            ? "no touches recorded"
            : `${touches.length} touches · ${matches} ${matches === 1 ? "match" : "matches"}`}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="w-full"
        role="img"
        aria-label={
          touches.length === 0
            ? `No touch map recorded for ${name}`
            : `Where ${name} touched the ball, across ${matches} matches. He attacks to the right.`
        }
      >
        <defs>
          <filter id={`blur-${id}`} x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation={BLUR} />
          </filter>
          {/* The blur spreads past the touchline; without this a man who played
              wide is shaded outside the pitch, which looks like a rendering
              fault rather than a full-back. */}
          <clipPath id={`inside-${id}`}>
            <rect width={BOX.width} height={BOX.height} />
          </clipPath>
        </defs>

        <rect width={BOX.width} height={BOX.height} fill="var(--color-pitch-turf)" />
        {/* The mown bands, which are what make it read as a pitch rather than as
            a green box — `tokens.css` carries the pair and the argument. */}
        {[0, 2, 4, 6, 8].map((band) => (
          <rect key={band} x={band * 10} width="10" height={BOX.height} fill="var(--color-pitch-mow)" />
        ))}

        <g clipPath={`url(#inside-${id})`}>
          <g filter={`url(#blur-${id})`}>
            {cells.map((cell) => (
              <rect
                key={`${cell.x}-${cell.y}`}
                x={cell.x * BOX.width}
                y={cell.y * BOX.height}
                width={CELL.width * BOX.width}
                height={CELL.height * BOX.height}
                fill={RAMP[Math.min(RAMP.length - 1, Math.floor(cell.density * RAMP.length))]}
                opacity={shade(cell.density)}
              />
            ))}
          </g>
        </g>

        {/* Markings OVER the heat, so the map is read against the pitch rather
            than the pitch being lost under it. */}
        <g fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" opacity="0.65">
          <rect x="1" y="1" width="98" height="62" />
          <line x1="50" y1="1" x2="50" y2="63" />
          <circle cx="50" cy="32" r="8" />
          <rect x="1" y="16" width="12" height="32" />
          <rect x="87" y="16" width="12" height="32" />
        </g>
      </svg>
    </figure>
  );
}
