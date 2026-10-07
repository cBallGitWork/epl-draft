import Image from "next/image";
import { crestUrl, type PublishedStory, type StoryLineupSide, londonDayAndTime, DASH } from "@epl/core";
import { yoursInk } from "../../mine";

// The gameweek's predicted elevens by match: a listing printed from the export, which no writer sees.

export default function Lineups({
  story,
  named,
  mine,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
}) {
  const ties = story.extras?.lineups ?? [];
  if (ties.length === 0) return null;

  return (
    <div className="flex flex-col divide-y pt-4" style={{ borderColor: "var(--paper-rule)" }}>
      {ties.map((tie) => (
        <section key={`${tie.home.code}-${tie.away.code}`} className="py-4">
          <p className="font-sans text-2xs tracking-widest text-muted uppercase">
            {londonDayAndTime(tie.kickoff)}
          </p>
          {/* Side by side at every width: a match is two teams facing each
              other, and stacked they read as a list of twenty clubs. */}
          <div className="grid grid-cols-2 gap-x-3 pt-2 sm:gap-x-6">
            <Side side={tie.home} named={named} mine={mine} />
            <Side side={tie.away} named={named} mine={mine} />
          </div>
        </section>
      ))}
    </div>
  );
}

function Side({
  side,
  named,
  mine,
}: {
  side: StoryLineupSide;
  named: (teamId: string) => string;
  mine: string | null;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2">
        {/* Not `.crest` (a raster reads no desk token); boxed square, since a tall badge pushed its eleven down a line. */}
        <Image
          src={crestUrl({ code: side.code })}
          alt=""
          width={24}
          height={24}
          className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6"
        />
        <span className="paper-display min-w-0 truncate text-base leading-none font-semibold text-ink sm:text-lg">
          {side.club}
        </span>
        <span className="numeric shrink-0 text-3xs text-muted sm:text-2xs">{side.formation}</span>
      </h3>
      <ol className="flex flex-col pt-1.5">
        {side.men.map((man) => (
          <li key={man.name} className="flex gap-1.5 text-sm leading-snug sm:gap-2 sm:text-base">
            {/* His REAL position, in a gutter of its own so eleven names line
                up — the whole of what makes a team sheet scannable. A dash
                where the export had only FPL's fantasy letter to go on. */}
            <span className="w-6 shrink-0 pt-0.5 font-sans text-3xs tracking-wide text-faint uppercase sm:w-9 sm:pt-1 sm:text-2xs sm:tracking-widest">
              {man.position ?? DASH}
            </span>
            <p className="min-w-0 flex-1">
              <span className={yoursInk(man.owner !== undefined && man.owner === mine)}>
                {man.name}
              </span>
              {/* Owned is marked and unowned is not: a bracket on every one of
                  two hundred and twenty names is noise, and the question this
                  list answers is which of them somebody holds. */}
              {man.owner === undefined ? null : (
                <span className="text-muted"> ({named(man.owner)})</span>
              )}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
