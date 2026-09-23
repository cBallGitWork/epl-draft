import { clubColours, inkOn, DASH } from "@epl/core";
import type { Club, Shot } from "@epl/core";
import ShotMarks, { MarksKey } from "../../../components/football/ShotMarks";
import { LABEL } from "@/app/desk";

// Where a side's shots came from: one pitch per team, each attacking right.
//
// Craig, 10 Sep 2026, asking for a shot map among the advanced data. The marks
// are `ShotMarks`, shared with the analysis screen — radius carries xG by its
// SQUARE ROOT so that AREA is proportional, and outcome is fill and weight and
// never a new hue.
//
// **Split by team on 11 Sep 2026** (Craig: *"shot and touch maps need to be by
// team"*). It drew both sides on one pitch facing each other until then, and
// `mirrorShot` turned the away side round to do it. Splitting deletes that
// rotation rather than reorganising it: every coordinate the sister repo exports
// is player-relative — his own goal to the one he attacks — so a side on its own
// pitch is already facing the right way, and the mirror only ever existed to put
// two frames on one picture. Its core function went with the last caller,
// CODE_RULES §2.
//
// **A different pitch from the analysis screen's, deliberately.** That one is
// one man attacking right across a season and is a density field; this is one
// side's afternoon. The mark is what the two share and the mark is what moved to
// `components/football/`.

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

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-2xs">
        <span className={LABEL}>Shot map</span>
        <span className="shrink-0 text-faint">
          {homeShots.length + awayShots.length} shots · area is xG
        </span>
      </figcaption>

      <div className="grid gap-2 lg:grid-cols-2">
        <Side club={home} shots={homeShots} />
        <Side club={away} shots={awayShots} />
      </div>

      {/* **The shared key, drawn from the same `DRAWN` table as the marks**, so a
          key that disagrees with the picture is impossible. It shows the OUTCOME
          grammar, which is the half that is the same for both sides; which
          colour is which side is said by the plate over each pitch. */}
      <MarksKey />
    </figure>
  );
}

/** One side's shots on its own pitch, under its own colour. */
function Side({ club, shots }: { club: Club | undefined; shots: readonly Shot[] }) {
  const colours = clubColours(club?.shortName ?? "");
  const ink = inkOn(colours);

  return (
    <div className="flex flex-col">
      <div
        className="flex items-baseline justify-between gap-2 px-2 py-1 text-2xs font-bold uppercase"
        style={{ background: colours.primary, color: ink }}
      >
        <span className="min-w-0 truncate">{club?.shortName ?? DASH}</span>
        <span className="numeric shrink-0">{shots.length}</span>
      </div>

      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="w-full"
        role="img"
        aria-label={`Where ${club?.shortName ?? "the side"} shot from: ${shots.length} in all, attacking to the right.`}
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
          {/* Both boxes. A side attacks one of them and defends the other, and a
              pitch with one end drawn is a half-pitch. */}
          <rect x="0.5" y="13" width="16" height="38" />
          <rect x={BOX.width - 16.5} y="13" width="16" height="38" />
          <rect x="0.5" y="24" width="5.5" height="16" />
          <rect x={BOX.width - 6} y="24" width="5.5" height="16" />
        </g>

        {/* No transform: `ShotMarks` already maps a 0-100 `y` onto a 64-high box,
            which is this pitch's own height. */}
        <ShotMarks shots={shots} ink={colours.primary} />
      </svg>
    </div>
  );
}
