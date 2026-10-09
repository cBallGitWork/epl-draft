import type { ReactNode } from "react";
import type { Club, Shot } from "@epl/core";
import { clubColoursOf, plateOn } from "@epl/core";
import Marks from "../../components/football/ShotMarks";
import { KeyPassLines, KeyPassOrigins, Pitch } from "../../components/football/ShotPitch";
import { PITCH_BOX } from "../../components/football/pitchBox";
import Section from "../../components/shell/Section";
import HeatPitch from "../analysis/HeatPitch";
import { SMALL_CAPS } from "@/app/desk";
import { attackingSpan, type SeasonMaps as Maps } from "./maps";

// His season on three pitches (Craig, 9 Oct 2026): shots and chances on the attacking half, touches on the whole.
// Two halves beside one whole pitch draw at one height, on a phone (2+2 columns) and a desk (1+1+2).

const CREAM = "var(--color-cream)";

export default function SeasonMaps({ maps, club }: { maps: Maps; club: Club | undefined }) {
  if (maps.shots.length + maps.chances.length + maps.touches.length === 0) return null;
  const plate = plateOn(clubColoursOf(club));
  const label = (title: string, count: number, children: ReactNode, wide = false) => (
    <figure className={`flex min-w-0 flex-col gap-1 ${wide ? "col-span-2" : ""}`}>
      <figcaption
        className={`flex items-baseline justify-between gap-2 px-2 py-1 ${SMALL_CAPS}`}
        style={{ background: plate.background, color: plate.ink }}
      >
        <span className="min-w-0 truncate">{title}</span>
        <span className="numeric shrink-0">{count}</span>
      </figcaption>
      {children}
    </figure>
  );

  return (
    <Section>
      <div className="grid grid-cols-2 items-start gap-2 lg:grid-cols-4">
        {maps.shots.length === 0
          ? null
          : label("Shots", maps.shots.length, <Half shots={maps.shots} passes={false} />)}
        {maps.chances.length === 0
          ? null
          : label("Chances created", maps.chances.length, <Half shots={maps.chances} passes />)}
        {maps.touches.length === 0
          ? null
          : label(
              "Touches",
              maps.touches.length,
              <HeatPitch touches={maps.touches} id="season" label="Where he touched the ball this season, attacking right." />,
              true,
            )}
      </div>
    </Section>
  );
}

/** Shots on the half they were struck in; with `passes`, each from where the key pass began. */
function Half({ shots, passes }: { shots: readonly Shot[]; passes: boolean }) {
  const span = attackingSpan(passes ? [...shots, ...shots.flatMap((shot) => shot.pass ?? [])] : shots);
  return (
    <svg
      viewBox={`${span.x} 0 ${span.width} ${PITCH_BOX.height}`}
      className="w-full"
      role="img"
      aria-label={
        passes
          ? `The ${shots.length} shots he set up this season, each from where his pass began.`
          : `His ${shots.length} shots this season, attacking right.`
      }
    >
      <Pitch />
      {/* Pass lines under the marks, their origins over them. */}
      {passes ? <KeyPassLines shots={shots} colour={CREAM} /> : null}
      <Marks shots={shots} />
      {passes ? <KeyPassOrigins shots={shots} colour={CREAM} /> : null}
    </svg>
  );
}
