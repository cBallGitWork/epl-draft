import { clubColoursOf, inkOn, DASH } from "@epl/core";
import { PITCH_BOX } from "@/app/components/football/pitchBox";
import type { Club } from "@epl/core";
import { placeLabels } from "./labels";
import type { Placed } from "./labels";
import { SECTION_BAR } from "@/app/desk";

// Where an eleven actually played: every starter at the average of his own
// touches, one pitch per side.
//
// Craig, 11 Sep 2026: *"we can create a formation map for the real match page"*,
// and then *"call it average position"* — which is the name on the screen and now
// the name of the file, because a formation is four characters the team sheet
// already prints and this is the thing those four characters cannot say.
//
// **One pitch per side** (Craig, 11 Sep: *"shot and touch maps need to be by
// team"*). The first cut put both elevens on one pitch facing each other, which
// is how a shot map reads and is wrong for this one: twenty-two discs interleave
// through midfield by construction, so the reader is separating two teams before
// he can look at either shape. Split, each side keeps the frame the export
// stores it in — every coordinate is player-relative, his own goal to the one he
// attacks — so nothing is mirrored and both pitches read left to right.
//
// **The shape as MEASURED, which is what makes it a different object from the
// pitch that came off Line Ups** the same day. That one drew the formation's own
// slots, and Craig removed it (*"remove pitch view here, it doesnt work"*)
// because `sheet.formation` already said everything a slot diagram could. A back
// four camped on the halfway line and one pinned on its own box are the same
// four characters and not the same match.
//
// **The centre is SofaScore's own average position and needed no export.**
// `averageTouchPosition` over the touch cloud is their `average_x`/`average_y` to
// within the export's rounding — measured 11 Sep 2026, counted in
// `docs/record/PLATFORM_NOTES.md`, 30/30 fixtures and 438/440 starters.
//
// **Starters only.** A substitute's centre comes off as few as two touches and
// would be a noisy point pretending to be a position; `PlTeamSheet.lineup` is an
// exact eleven at 30/30, so the filter costs nothing and is the caller's.
//
// **The markers are HTML over the grass and not text in the SVG.** The pitch
// stretches — 358px under a thumb and about 530 in a desk column — and a
// `font-size` in viewBox units stretches with it, which would set these names at
// 9px on a phone and 28px on a desk.

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
  /** How many the team sheet NAMED, against however many of them the cloud can
   *  place. The two differ and the plate says so — see `Side`. */
  homeNamed: number;
  awayNamed: number;
}) {
  // Absent rather than an empty pitch, on `ShotMap`'s precedent: a match nobody
  // has played, or one the sister repo has not reached, is not one where
  // twenty-two men stood in the corner.
  if (homeMen.length === 0 && awayMen.length === 0) return null;

  return (
    <figure className="flex flex-col gap-1">
      {/* CM's blue title row, the same as the one over the shots. */}
      <figcaption className={`${SECTION_BAR} max-lg:hidden`}>
        Average position
      </figcaption>

      {/* Side by side on a desk and stacked under a thumb. Two pitches sharing
          390px would be 195px each, which is a five-letter name every forty
          pixels; the phone gets the full width twice instead. */}
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
      {/* The club's own plate over its grass, which is how every other pair on
          this screen says which side is which — and the formation at its right,
          where `cm9900/19.jpg` sets "4-4-2*" over Everton's pitch. */}
      <div
        className="flex items-baseline justify-between gap-2 px-2 py-1 text-2xs font-bold uppercase"
        style={{ background: colours.primary, color: ink }}
      >
        <span className="min-w-0 truncate">{club?.shortName ?? DASH}</span>
        {/* **A man with no cloud is dropped, and the plate is where that is
            admitted.** `teamSheet.ts` sets the precedent for the dropping — "a
            pitch with a hole in it is a worse answer than a pitch with ten men" —
            but a reader counting ten discs and finding no gap has been told
            Ipswich played a man short. Counted on this fixture: Exequiel
            Palacios started and the export carries no touches for him, which is
            the ordinary miss `intel.ts` names. Silent while every named man is
            on the grass, which is the usual case. */}
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

        {/* **The disc and the name are two marks, not one block.** They were a
            flex column until the labels had to come apart: a name that has been
            moved a row to clear another man cannot be carried by the thing it
            has moved away from. `labels.ts` owns where it lands and why. */}
        {labelled.map((man) => (
          <span
            key={man.code}
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/70 lg:size-3"
            style={{ left: `${man.x}%`, top: `${man.y}%`, backgroundColor: colours.primary }}
          />
        ))}
        {/* White on the grass with no plate under it, which is `PitchMarker`'s
            own reading: cream measures better than 11:1 on CM's dark green, and
            a row of black bars is what made an earlier pitch read as cards on
            grass rather than as a team. One step over DESIGN §6's pitch floor
            (Craig, 23 Sep 2026: *"just a little bigger, but not much"*). */}
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
