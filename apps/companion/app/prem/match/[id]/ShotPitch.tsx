import type { Shot } from "@epl/core";
import { PITCH_BOX, toBoxY } from "@/app/components/football/pitchBox";
import { HALO } from "../../../components/football/ShotMarks";

// The match shot map's ground and its key passes, drawn in pitch units.

/** A key pass line's width, and the side of the square at its start, in pitch units. */
const PASS_LINE = 0.3;
const PASS_SQUARE = 1.4;
/** The dashes a pass is drawn in, so it never reads as a pitch line, and how strongly its cream underlay shows. */
const PASS_DASH = "1.2 0.8";
const PASS_UNDERLAY = 0.6;

/** A key pass: a dashed line in the side's colour from where it started to where the shot was struck, over a cream
 *  underlay as the marks wear a halo, with a square at its origin so it never reads as a shot's round mark. */
export function KeyPass({ shot, from, colour }: { shot: Shot; from: { x: number; y: number }; colour: string }) {
  const line = { x1: from.x, y1: toBoxY(from.y), x2: shot.x, y2: toBoxY(shot.y) };
  return (
    <g>
      <line {...line} stroke="var(--color-cream)" strokeWidth={PASS_LINE + 2 * HALO} opacity={PASS_UNDERLAY} />
      <line {...line} stroke={colour} strokeWidth={PASS_LINE} strokeDasharray={PASS_DASH} />
      <rect
        x={line.x1 - PASS_SQUARE / 2}
        y={line.y1 - PASS_SQUARE / 2}
        width={PASS_SQUARE}
        height={PASS_SQUARE}
        fill={colour}
        stroke="var(--color-cream)"
        strokeWidth={HALO}
      />
    </g>
  );
}

/** The key's entry for a key pass: its square and a stub of its line, off the same numbers as the pitch. */
export function KeyPassKey() {
  return (
    <li className="flex items-center gap-1">
      <svg width="16" height="11" viewBox="-1 -1.6 5 3.2" aria-hidden className="shrink-0">
        <line x1="0" y1="0" x2="3.8" y2="0" stroke="var(--color-cream)" strokeWidth={PASS_LINE} strokeDasharray={PASS_DASH} />
        <rect
          x={-PASS_SQUARE / 2}
          y={-PASS_SQUARE / 2}
          width={PASS_SQUARE}
          height={PASS_SQUARE}
          fill="var(--color-cream)"
        />
      </svg>
      Key pass
    </li>
  );
}

/** Turf, mown bands, and both boxes — a side attacks one end and defends the other. */
export function Pitch() {
  return (
    <>
      <rect
        width={PITCH_BOX.width}
        height={PITCH_BOX.height}
        fill="var(--color-pitch-turf)"
      />
      {[0, 2, 4, 6, 8].map((band) => (
        <rect
          key={band}
          x={band * 10}
          width="10"
          height={PITCH_BOX.height}
          fill="var(--color-pitch-mow)"
        />
      ))}
      <g
        fill="none"
        stroke="var(--color-pitch-line)"
        strokeWidth="0.4"
        opacity="0.65"
      >
        <rect
          x="0.5"
          y="0.5"
          width={PITCH_BOX.width - 1}
          height={PITCH_BOX.height - 1}
        />
        <line x1="50" y1="0.5" x2="50" y2={PITCH_BOX.height - 0.5} />
        <circle cx="50" cy={PITCH_BOX.height / 2} r="9" />
        <rect x="0.5" y="13" width="16" height="38" />
        <rect x={PITCH_BOX.width - 16.5} y="13" width="16" height="38" />
        <rect x="0.5" y="24" width="5.5" height="16" />
        <rect x={PITCH_BOX.width - 6} y="24" width="5.5" height="16" />
      </g>
    </>
  );
}
