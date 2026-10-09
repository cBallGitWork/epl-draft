import type { Touch } from "@epl/core";
import { Pitch } from "../../components/football/ShotPitch";
import { CELL, heatCells, shade } from "./heat";
import { PITCH_BOX } from "@/app/components/football/pitchBox";

// One man's touches as heat on a pitch, a Gaussian blur over `heat.ts`'s cells as an SVG filter so it is
// server-rendered. A warm ramp rather than his club's colour, which vanishes on grass for some.
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

/** Two places, far under a pixel: a cell's raw float is ~16 digits, and a busy man draws 200+ cells twice over. */
const near = (value: number) => Math.round(value * 100) / 100;

export default function HeatPitch({
  touches,
  id,
  label,
}: {
  touches: readonly Touch[];
  /** Unique per pitch on the page: an SVG filter id is global to the document. */
  id: string;
  /** What a screen reader is told the pitch shows. */
  label: string;
}) {
  const cells = heatCells(touches);

  return (
    <svg viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`} className="w-full" role="img" aria-label={label}>
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
              {cells.map((cell) => {
                const x = near(cell.x * PITCH_BOX.width);
                const y = near(cell.y * PITCH_BOX.height);
                return (
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={near(CELL.width * PITCH_BOX.width)}
                    height={near(CELL.height * PITCH_BOX.height)}
                    fill={RAMP[Math.min(RAMP.length - 1, Math.floor(cell.density ** RAMP_CURVE * RAMP.length))]}
                    opacity={near(shade(cell.density))}
                  />
                );
              })}
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
  );
}
