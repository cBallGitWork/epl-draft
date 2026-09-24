import type { Club, Touch } from "@epl/core";
import { clubColoursOf, inkOn } from "@epl/core";
import { Pitch } from "../../components/football/ShotPitch";
import { CELL, heatCells, shade } from "./heat";
import { PITCH_BOX } from "@/app/components/football/pitchBox";

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
// It is a scale where every other colour in §3 is a slot, so it stays local to the pitch: it shades a colour
// PLATE (DESIGN §5, beside the pitch and the crest) and never ink, a cell or a control.

/** The attacking arrow: how far along, how high, and how heavy.
 *
 *  Craig, 10 Sep 2026: *"have a very feint thick arrow on the pitch to indicate
 *  thats the attack"*. It replaces a line of prose under the maps that said the
 *  same thing in words — a picture of the direction, drawn on the thing it is
 *  about, beats a sentence two inches below it.
 *
 *  **Top centre, which is the one part of the pitch no map fills.** A shot map
 *  lives in the attacking third and a touch map spreads along the middle; the
 *  strip above the centre circle is empty for everyone, so the arrow never sits
 *  on a reader's data. Faint enough to be furniture — it is the same claim for
 *  every map on the screen, so it must not compete with the one thing that
 *  differs. */
const ARROW = { from: 41, to: 59, y: 5.5, head: 2.6, weight: 1.6, ink: 0.22 };

/** How far the blur reaches, in pitch units.
 *
 *  A little under half a cell (`heat.ts` draws them 4.17 x 4.00), so one touch
 *  spreads to about the area a player actually controls and two touches a cell
 *  apart merge into one shape. Larger and every map becomes the same fog AND
 *  loses intensity, which is what made the first maps faint; smaller and the
 *  cell edges come back, which is the fault the blur exists to fix. */
const BLUR = 1.7;

/** The ramp, coldest first, as it is laid over grass.
 *
 *  Yellow through orange to red: the order reads as intensity without a key,
 *  which is the only reason a ramp is allowed to carry meaning at all here.
 *  Written out literally rather than composed, because Tailwind v4 drops a theme
 *  variable whose name never appears in scanned source — and because these are
 *  SVG `fill` values, which never pass through Tailwind at all. */
const RAMP = ["#f2e05a", "#f0a93c", "#e2622c", "#c8281c"] as const;

/** Red for his densest cells only, orange and yellow for the rest: without it a map scaled to his crowded cells
 *  (heat.ts) reddens a quarter of the pitch. */
const RAMP_CURVE = 2;

/** How far the density curve and the blur are tuned against each other lives in
 *  `heat.ts` beside `shade`, because it is arithmetic with a test rather than a
 *  drawing decision. Change one of the two and re-read a map. */

export default function PlayerMap({
  name,
  club,
  touches,
  matches,
  id,
}: {
  name: string;
  /** His club, whose colours carry the strip over his pitch. */
  club: Club | undefined;
  touches: readonly Touch[];
  /** How many fixtures the marks came from, for the caption. */
  matches: number;
  /** Unique per pitch on the page: an SVG filter id is global to the document. */
  id: string;
}) {
  const cells = heatCells(touches);
  const colours = clubColoursOf(club);

  return (
    <figure className="flex min-w-0 flex-col gap-1">
      <figcaption
        className="flex items-baseline justify-between gap-2 px-2 py-1 text-2xs font-bold uppercase"
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        <span className="min-w-0 truncate">{name}</span>
        {/* Volume in words: every map is normalised to its own busiest cell, so the pitch does not carry it. */}
        <span className="numeric shrink-0">
          {touches.length === 0
            ? "no touches recorded"
            : `${touches.length} touches · ${matches} ${matches === 1 ? "match" : "matches"}`}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`}
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
          {/* The blur spreads past the touchline; without this a wide man is shaded outside the pitch. */}
          <clipPath id={`inside-${id}`}>
            <rect width={PITCH_BOX.width} height={PITCH_BOX.height} />
          </clipPath>
        </defs>

        {/* The heat under the lines, so the map is read against the pitch. */}
        <Pitch
          under={
            <g clipPath={`url(#inside-${id})`}>
              <g filter={`url(#blur-${id})`}>
                {cells.map((cell) => (
                  <rect
                    key={`${cell.x}-${cell.y}`}
                    x={cell.x * PITCH_BOX.width}
                    y={cell.y * PITCH_BOX.height}
                    width={CELL.width * PITCH_BOX.width}
                    height={CELL.height * PITCH_BOX.height}
                    fill={RAMP[Math.min(RAMP.length - 1, Math.floor(cell.density ** RAMP_CURVE * RAMP.length))]}
                    opacity={shade(cell.density)}
                  />
                ))}
              </g>
            </g>
          }
        />

        {/* Which way he is playing, said on the pitch rather than under it. */}
        <g stroke="var(--color-cream)" fill="var(--color-cream)" opacity={ARROW.ink} aria-hidden>
          <line
            x1={ARROW.from}
            y1={ARROW.y}
            x2={ARROW.to - ARROW.head}
            y2={ARROW.y}
            strokeWidth={ARROW.weight}
            strokeLinecap="butt"
          />
          <polygon
            points={`${ARROW.to},${ARROW.y} ${ARROW.to - ARROW.head},${ARROW.y - ARROW.head * 0.8} ${ARROW.to - ARROW.head},${ARROW.y + ARROW.head * 0.8}`}
            stroke="none"
          />
        </g>
      </svg>
    </figure>
  );
}
