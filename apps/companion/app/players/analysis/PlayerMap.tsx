import type { Club, Touch } from "@epl/core";
import { clubColoursOf, plateOn } from "@epl/core";
import HeatPitch from "./HeatPitch";
import { SMALL_CAPS } from "@/app/desk";

// One man's pitch, shaded where he played, under a strip in his club's colours: a pitch each, the same way round.

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

      <HeatPitch
        touches={touches}
        id={id}
        label={
          touches.length === 0
            ? `No touch map recorded for ${name}`
            : `Where ${name} touched the ball, across ${matches} matches. He attacks to the right.`
        }
      />
    </figure>
  );
}
