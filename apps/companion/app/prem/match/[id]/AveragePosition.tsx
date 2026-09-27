import { clubColoursOf, inkOn, DASH } from "@epl/core";
import { PITCH_BOX } from "@/app/components/football/pitchBox";
import type { Club } from "@epl/core";
import { placeLabels } from "./labels";
import type { Placed } from "./labels";
import { SECTION_BAR, SMALL_CAPS } from "@/app/desk";

// Where each eleven actually played: every starter at the average of his own touches (SofaScore's own average
// position, 30/30 fixtures, PLATFORM_NOTES), one pitch per side so the shapes do not interleave. Starters only —
// a substitute's centre can come off two touches. The names are HTML over the grass so they do not scale with it.

// `ShotMap`'s markings, copied: two occurrences, declined until a third (CODE_RULES §1).

export default function AveragePosition({
  home,
  away,
  homeMen,
  awayMen,
  homeShape,
  awayShape,
  homeNamed,
  awayNamed,
}: {
  home: Club | undefined;
  away: Club | undefined;
  homeMen: readonly Placed[];
  awayMen: readonly Placed[];
  /** `"4-3-3"`, or null for a sheet that carried none. */
  homeShape: string | null;
  awayShape: string | null;
  /** How many the team sheet named, against however many the cloud can place — see `Side`. */
  homeNamed: number;
  awayNamed: number;
}) {
  // Absent rather than twenty-two men in the corner, for a match the export has not reached.
  if (homeMen.length === 0 && awayMen.length === 0) return null;

  return (
    <figure className="flex flex-col gap-1">
      {/* CM's blue title row, the same as the one over the shots. */}
      <figcaption className={`${SECTION_BAR} max-lg:hidden`}>
        Average position
      </figcaption>

      {/* Side by side on a desk, stacked under a thumb: two pitches in 390px are a name every forty pixels. */}
      <div className="grid gap-2 lg:grid-cols-2">
        <Side club={home} men={homeMen} shape={homeShape} named={homeNamed} />
        <Side club={away} men={awayMen} shape={awayShape} named={awayNamed} />
      </div>
    </figure>
  );
}

/** One side's eleven on its own pitch, under its own colour. */
function Side({
  club,
  men,
  shape,
  named,
}: {
  club: Club | undefined;
  men: readonly Placed[];
  shape: string | null;
  named: number;
}) {
  const colours = clubColoursOf(club);
  const ink = inkOn(colours);
  const labelled = placeLabels(men);

  return (
    <div className="flex flex-col">
      {/* The club's plate over its grass, and its formation at the right as `cm9900/19.jpg` sets it. */}
      <div
        className={`flex items-baseline justify-between gap-2 px-2 py-1 ${SMALL_CAPS}`}
        style={{ background: colours.primary, color: ink }}
      >
        <span className="min-w-0 truncate">{club?.shortName ?? DASH}</span>
        {/* A man with no touches is dropped, and the plate admits it: `10 of 11`. */}
        <span className="numeric shrink-0">
          {men.length < named ? `${men.length} of ${named} · ` : ""}
          {shape ?? ""}
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${PITCH_BOX.width} / ${PITCH_BOX.height}` }}
        role="img"
        aria-label={`Where ${club?.shortName ?? "the side"} played: each starter at the average of his own touches, attacking to the right.`}
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <rect width={PITCH_BOX.width} height={PITCH_BOX.height} fill="var(--color-pitch-turf)" />
          {[0, 2, 4, 6, 8].map((band) => (
            <rect
              key={band}
              x={band * 10}
              width="10"
              height={PITCH_BOX.height}
              fill="var(--color-pitch-mow)"
            />
          ))}
          <g fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" opacity="0.65">
            <rect x="0.5" y="0.5" width={PITCH_BOX.width - 1} height={PITCH_BOX.height - 1} />
            <line x1="50" y1="0.5" x2="50" y2={PITCH_BOX.height - 0.5} />
            <circle cx="50" cy={PITCH_BOX.height / 2} r="9" />
            <rect x="0.5" y="13" width="16" height="38" />
            <rect x={PITCH_BOX.width - 16.5} y="13" width="16" height="38" />
            <rect x="0.5" y="24" width="5.5" height="16" />
            <rect x={PITCH_BOX.width - 6} y="24" width="5.5" height="16" />
          </g>
        </svg>

        {/* The disc and the name are two marks: `labels.ts` moves a name to clear another man; the disc never moves. */}
        {labelled.map((man) => (
          <span
            key={man.code}
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/70 lg:size-3"
            style={{ left: `${man.x}%`, top: `${man.y}%`, backgroundColor: colours.primary }}
          />
        ))}
        {/* Cream straight on the grass, one step over DESIGN §6's pitch floor (Craig, 23 Sep 2026). */}
        {labelled.map((man) => (
          <span
            key={man.code}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-2xs font-bold leading-none text-cream lg:text-xs"
            style={{ left: `${man.labelX}%`, top: `${man.labelY}%` }}
          >
            {man.name}
          </span>
        ))}
      </div>
    </div>
  );
}
