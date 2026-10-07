import type { Club, Touch } from "@epl/core";
import { clubColoursOf, plateOn } from "@epl/core";
import { Pitch } from "../../components/football/ShotPitch";
import { CELL, heatCells, shade } from "./heat";
import { PITCH_BOX } from "@/app/components/football/pitchBox";
import { SMALL_CAPS } from "@/app/desk";

// One man's pitch, shaded where he played: a pitch each, the same way round, a Gaussian blur over `heat.ts`'s cells as
// an SVG filter so it is server-rendered. A warm ramp rather than his club's colour, which vanishes on grass for some.
// The ramp is a scale, not a slot, so it stays a plate on the pitch (DESIGN §5) and never ink, a cell or a control.

/** The faint attacking arrow (Craig, 10 Sep 2026), top centre, where no map is drawn. */
const ARROW = { from: 41, to: 59, y: 5.5, head: 2.6, weight: 1.6, ink: 0.22 };

/** How far the blur reaches, in pitch units: a little under half a cell, so neighbouring touches merge. */
const BLUR = 1.7;

/** The ramp, coldest first: yellow through orange to red reads as intensity without a key. SVG fills, so literals. */
const RAMP = ["#f2e05a", "#f0a93c", "#e2622c", "#c8281c"] as const;

/** Red for his densest cells only, orange and yellow for the rest: without it a map scaled to his crowded cells
 *  (heat.ts) reddens a quarter of the pitch. */
const RAMP_CURVE = 2;


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
  const plate = plateOn(clubColoursOf(club));

  return (
    <figure className="flex min-w-0 flex-col gap-1">
      <figcaption
        className={`flex items-baseline justify-between gap-2 px-2 py-1 ${SMALL_CAPS}`}
        style={{ background: plate.background, color: plate.ink }}
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
