import type { Opposition } from "@epl/core";
import Section from "../../components/shell/Section";
import { fdrStep } from "../../components/football/fdr";
import { standoutInk } from "../../components/league/standout";
import { DASH, fixed, ordinal } from "@epl/core";
import type { ProjectedWeek } from "./grid";

// What is coming, as a run: FPL's difficulty on each block, under it the sister model's xMins for that gameweek, and,
// while projections are on, its points in our league's scoring and his place in his group, lit on the pool board's
// standout rule. No source caption (Craig, 30 Sep 2026); each figure's title says whose it is.

export default function FixtureRun({
  run,
  minutes,
  weeks,
  group,
}: {
  run: Opposition[];
  /** His xMins by gameweek. */
  minutes: ReadonlyMap<number, number | null>;
  /** The model's projection by gameweek, or null while projections are off (`PROJECTIONS_SHOWN`). */
  weeks: ReadonlyMap<number, ProjectedWeek> | null;
  /** Who he is ranked among, for the rank's title. */
  group: string | null;
}) {
  // A club with nothing left has an empty run, and a heading over no blocks is a claim that something is missing.
  if (run.length === 0) return null;

  return (
    <Section title="Next up">
      <ol className="flex items-stretch gap-1">
        {run.map((against, at) => {
          const gw = against.fixture.gameweek;
          // A double gameweek's figure is the week's, so it sits under the week's first match only.
          const repeat = gw !== null && run.slice(0, at).some((earlier) => earlier.fixture.gameweek === gw);
          const step = fdrStep(against.difficulty);
          return (
            <li key={against.fixture.id} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="numeric text-center text-2xs text-faint">
                {/* A rearranged match can lose its round; it keeps its place in the run and says so. */}
                {gw === null ? DASH : `GW${gw}`}
              </span>
              <span
                className={`numeric flex min-h-11 flex-col items-center justify-center px-1 text-xs font-bold leading-tight ${step.ink}`}
                style={{ backgroundColor: step.ground }}
              >
                <span className="truncate">{against.club.shortName}</span>
                <span className="text-2xs font-normal opacity-80">{against.home ? "H" : "A"}</span>
              </span>
              {repeat || gw === null ? null : (
                <>
                  <span
                    className="numeric text-center text-xs font-bold text-info"
                    title={`Expected minutes in gameweek ${gw}, by our model`}
                  >
                    {minutes.get(gw) ?? DASH}
                  </span>
                  {weeks === null ? null : <Projected week={weeks.get(gw)} group={group} />}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/** The two lines under a block. */
const PROJECTED = "numeric flex flex-col items-center text-xs leading-tight";

/** His projected points and his place, in one ink; a dash each where the model has no reading. */
function Projected({ week, group }: { week: ProjectedWeek | undefined; group: string | null }) {
  const place = week?.place ?? null;
  if (place === null) {
    return (
      <span className={`${PROJECTED} text-faint`}>
        <span>{DASH}</span>
        <span>{DASH}</span>
      </span>
    );
  }
  const ink = standoutInk(place.points, week?.cut, "high");
  return (
    <span
      className={`${PROJECTED} ${ink === "" ? "text-ink" : ink}`}
      title={`Our model projects ${fixed(place.points, "projected")} points, ${ordinal(place.rank)} of ${place.of} ${group ?? "players"}`}
    >
      <span className="font-bold">{fixed(place.points, "projected")}</span>
      <span>{ordinal(place.rank)}</span>
    </span>
  );
}
