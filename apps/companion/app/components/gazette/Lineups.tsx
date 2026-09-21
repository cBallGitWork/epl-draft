import Image from "next/image";
import { crestUrl, type PublishedStory, type StoryLineupSide } from "@epl/core";
import { londonDayAndTime } from "../../londonTime";
import { yoursInk } from "../../mine";

// The round's predicted elevens, grouped by the match they are for.
//
// A listing and not a column: every word of it is a name, a position or a
// count, so the desk prints it from the export and no writer sees it.

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
          {/* Stacked on a phone, side by side once there is room for two
              elevens. Each side keeps its own name because a stacked pair has
              nothing else to tell them apart. */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 pt-2 sm:grid-cols-2">
            <Side side={tie.home} named={named} mine={mine} />
            {/* Stacked, the two elevens are a fixture only if something says
                so. Side by side they read as one already. */}
            <p className="font-sans text-2xs tracking-widest text-faint uppercase sm:hidden">
              <span className="pl-9">v</span>
            </p>
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
        {/* A raster badge reads none of the desk's tokens, so it is not `.crest`
            — the selector that restores them (DESIGN §5). Boxed square because
            the badges are not: Liverpool's is tall and pushed its eleven a line
            below Ipswich's beside it. */}
        <Image
          src={crestUrl({ code: side.code })}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 object-contain"
        />
        <span className="paper-display min-w-0 truncate text-lg leading-none font-semibold text-ink">
          {side.club}
        </span>
        <span className="numeric shrink-0 text-2xs text-muted">{side.formation}</span>
      </h3>
      <ol className="flex flex-col pt-1.5">
        {side.men.map((man) => (
          <li key={man.name} className="flex gap-2 text-base leading-snug">
            {/* His REAL position, in a gutter of its own so eleven names line
                up — the whole of what makes a team sheet scannable. A dash
                where the export had only FPL's fantasy letter to go on. */}
            <span className="w-9 shrink-0 pt-1 font-sans text-2xs tracking-widest text-faint uppercase">
              {man.position ?? "—"}
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
