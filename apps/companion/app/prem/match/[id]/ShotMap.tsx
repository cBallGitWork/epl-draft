import { clubColours, mirrorShot } from "@epl/core";
import type { Club, Shot } from "@epl/core";
import ShotMarks, { MarksKey } from "../../../components/football/ShotMarks";
import { LABEL } from "@/app/desk";

// Every shot in the match, on one pitch, the two sides attacking opposite ways.
//
// Craig, 10 Sep 2026, asking for a shot map among the advanced data. The marks
// are `ShotMarks`, shared with the analysis screen — radius carries xG by its
// SQUARE ROOT so that AREA is proportional, and outcome is fill and weight and
// never a new hue.
//
// **A different pitch from the analysis screen's, deliberately.** That one is
// one man attacking right across a season and is a density field; this is one
// match with two sides in it, so it runs the full length with a halfway line and
// somebody has to be turned around. The mark is what the two share and the mark
// is what moved to `components/football/`.
//
// **The away side is mirrored, and that is a data fact rather than a drawing
// decision.** Every coordinate the sister repo exports is PLAYER-relative — "his
// own goal to the one he attacks" — so both sides are stored attacking right and
// drawn straight they pile into the same half. `mirrorShot` rotates rather than
// flips: turning a pitch around swaps left and right as well as ends.

/** The pitch, in its own units. 100 long by 64 wide is close enough to a real
 *  one that the penalty area drawn below lands where the eye expects it. */
const BOX = { width: 100, height: 64 };

export default function ShotMap({
  home,
  away,
  homeShots,
  awayShots,
}: {
  home: Club | undefined;
  away: Club | undefined;
  homeShots: readonly Shot[];
  awayShots: readonly Shot[];
}) {
  // Absent rather than an empty pitch: a match nobody has played, or one the
  // sister repo has not reached, is not a goalless one.
  if (homeShots.length === 0 && awayShots.length === 0) return null;

  // The home side keeps the frame it was stored in and attacks right; the away
  // side is turned around to attack left, which is how a match is drawn.
  const turned = awayShots.map(mirrorShot);

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-2xs">
        <span className={LABEL}>Shot map</span>
        <span className="shrink-0 text-faint">
          {homeShots.length + turned.length} shots · area is xG
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="w-full"
        role="img"
        aria-label={`Where the shots came from. ${home?.shortName ?? "The home side"} attacks to the right with ${homeShots.length}; ${away?.shortName ?? "the away side"} attacks to the left with ${turned.length}.`}
      >
        <rect width={BOX.width} height={BOX.height} fill="var(--color-pitch-turf)" />
        {/* The mown bands, which are what make it read as a pitch rather than a
            green box — `tokens.css` carries the pair and the argument. */}
        {[0, 2, 4, 6, 8].map((band) => (
          <rect
            key={band}
            x={band * 10}
            width="10"
            height={BOX.height}
            fill="var(--color-pitch-mow)"
          />
        ))}

        <g fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" opacity="0.65">
          <rect x="0.5" y="0.5" width={BOX.width - 1} height={BOX.height - 1} />
          <line x1="50" y1="0.5" x2="50" y2={BOX.height - 0.5} />
          <circle cx="50" cy={BOX.height / 2} r="9" />
          {/* Both boxes, because both ends are attacked here. */}
          <rect x="0.5" y="13" width="16" height="38" />
          <rect x={BOX.width - 16.5} y="13" width="16" height="38" />
          <rect x="0.5" y="24" width="5.5" height="16" />
          <rect x={BOX.width - 6} y="24" width="5.5" height="16" />
        </g>

        {/* **Each side in its own club colour**, which is the one thing this map
            needs that the analysis screen's does not: there the caption names the
            man, and here two sets of marks share one pitch and nothing else could
            tell them apart. `ShotMarks` takes the colour so the outcome grammar —
            fill for scored, outline for the rest — is unchanged. */}
        {/* No transform: `ShotMarks` already maps a 0-100 `y` onto a 64-high box,
            which is this pitch's own height. */}
        <ShotMarks shots={homeShots} ink={clubColours(home?.shortName ?? "").primary} />
        <ShotMarks shots={turned} ink={clubColours(away?.shortName ?? "").primary} />
      </svg>

      {/* **The shared key, drawn from the same `DRAWN` table as the marks**, so a
          key that disagrees with the picture is impossible. It shows the OUTCOME
          grammar, which is the half that is the same for both sides; which
          colour is which side is said by the crest-coloured bar above the pitch
          and by the two clubs' own plates on this screen. */}
      <MarksKey />
    </figure>
  );
}
