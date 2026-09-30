import type { Shot } from "@epl/core";
import type { ReactNode } from "react";
import { PITCH_BOX, toBoxY } from "./pitchBox";
import { HALO, passLine } from "./shotGeometry";

// A landscape pitch and a key pass, in pitch units: the match page's shot map and Compare's maps.

/** A key pass line's width, and the side of the square at its start, in pitch units. */
const PASS_LINE = 0.25;
const PASS_SQUARE = 1;
/** The dashes a pass is drawn in, so it never reads as a pitch line, and how strongly its cream underlay shows. */
const PASS_DASH = "1.2 0.8";
const PASS_UNDERLAY = 0.45;
/** A pass is the lesser half of the picture, so its line sits back behind the marks. */
const PASS_OPACITY = 0.85;

/** Each key pass's line, drawn under the marks: dashed in the side's colour over a faint cream underlay, from where
 *  it started to the edge of the shot's mark. */
export function KeyPassLines({ shots, colour }: { shots: readonly Shot[]; colour: string }) {
  return (
    <g>
      {shots.map((shot, at) => {
        const line = shot.pass === null ? null : passLine(shot.pass, shot);
        return line === null ? null : (
          <g key={at} opacity={PASS_OPACITY}>
            <line {...line} stroke="var(--color-cream)" strokeWidth={PASS_LINE} opacity={PASS_UNDERLAY} />
            <line {...line} stroke={colour} strokeWidth={PASS_LINE} strokeDasharray={PASS_DASH} />
          </g>
        );
      })}
    </g>
  );
}

/** Where each key pass started: a square, so it never reads as a shot, drawn over the marks so none can hide it. */
export function KeyPassOrigins({ shots, colour }: { shots: readonly Shot[]; colour: string }) {
  return (
    <g>
      {shots.map((shot, at) =>
        shot.pass === null ? null : (
          <rect
            key={at}
            x={shot.pass.x - PASS_SQUARE / 2}
            y={toBoxY(shot.pass.y) - PASS_SQUARE / 2}
            width={PASS_SQUARE}
            height={PASS_SQUARE}
            fill={colour}
            stroke="var(--color-cream)"
            strokeWidth={HALO}
          />
        ),
      )}
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

/** Turf, mown bands, and both boxes. `under` draws between the grass and the lines, as a heat map does. */
export function Pitch({ under = null }: { under?: ReactNode }) {
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
      {under}
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
