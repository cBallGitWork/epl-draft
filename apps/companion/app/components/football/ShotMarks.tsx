import type { ReactNode } from "react";
import type { Shot } from "@epl/core";
import { toBoxY } from "./pitchBox";
import { DRAWN, HALO, TIER, drawOrder, markRadius } from "./shotGeometry";

// Shots as marks on the grass: size is the chance (by area), fill and weight the outcome, never a new hue.
// Three tiers, not five: a block and a miss differ by a number in the table, not a ring nobody can measure.

const HALO_OPACITY = 0.75;

/** What each tier is called, in the order the key reads them — best first. */
const TIER_LABEL = [
  ["goal", "Goal"],
  ["target", "On target"],
  ["off", "Off target"],
] as const;

export default function Marks({
  shots,
  ink = "var(--color-cream)",
}: {
  shots: readonly Shot[];
  /** Cream by default; a map with two sets of marks gives each its club colour, which changes the hue, never the grammar. */
  ink?: string;
}) {
  return (
    <g>
      {drawOrder(shots).map((at) => {
        const shot = shots[at];
        const tier = TIER[shot.outcome];
        const r = markRadius(shot.xg);
        // The index is the key: a rebound can share a man, a minute and a spot.
        return (
          <g key={at}>
            {/* A cream halo (14 of 20 club colours are under 3:1 on the mow band, cream 10.5:1) round
                a disc of turf that hides whatever this mark overlaps. */}
            <circle
              cx={shot.x}
              cy={toBoxY(shot.y)}
              r={r + DRAWN[tier].width / 2 + HALO / 2}
              fill="var(--color-pitch-turf)"
              stroke="var(--color-cream)"
              strokeWidth={HALO}
              strokeOpacity={HALO_OPACITY}
            />
            <circle
              cx={shot.x}
              cy={toBoxY(shot.y)}
              r={r}
              fill={DRAWN[tier].fill === "none" ? "none" : ink}
              stroke={ink}
              strokeWidth={DRAWN[tier].width}
              opacity={DRAWN[tier].opacity}
            />
          </g>
        );
      })}
    </g>
  );
}

/** The key, drawn from `DRAWN` so it is the same object as the marks on the grass; said once per section. */
export function MarksKey({ children }: { children?: ReactNode }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xs text-faint">
      {TIER_LABEL.map(([tier, label]) => (
        <li key={tier} className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="-1.6 -1.6 3.2 3.2" aria-hidden className="shrink-0">
            <circle
              r="1.2"
              fill={DRAWN[tier].fill}
              stroke="var(--color-cream)"
              strokeWidth={DRAWN[tier].width}
              opacity={DRAWN[tier].opacity}
            />
          </svg>
          {label}
        </li>
      ))}
      {/* A map's own entries, such as the match map's key pass. */}
      {children}
      {/* The other half of the encoding, and the half a ring cannot show. */}
      <li className="text-faint">Size is the chance behind it</li>
    </ul>
  );
}
