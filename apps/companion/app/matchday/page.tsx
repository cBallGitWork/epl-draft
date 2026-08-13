import ButtonLink from "../components/shell/ButtonLink";
import { type FootballSnapshot, duringGameweek } from "@epl/core";
import { footballNow } from "../football";
import GameweekView from "../components/football/GameweekView";
import YourMatchup from "./YourMatchup";
import PageHeader from "../components/shell/PageHeader";
import { londonDayAndTime } from "../londonTime";

// The live centre. Your head-to-head first, the real football under it — the
// order a manager actually cares about them in.
//
// The football half runs entirely off FPL's public API, so it works from the
// first match of the season without Fantrax, a draft, or a single credential.
// The head-to-head renders nothing when there is nothing to say, which keeps
// that true.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** The snapshot and whether there is football on. The clock is read here rather
 *  than in the component: a render is meant to be reproducible, and fetching is
 *  already where this page touches the world. */
async function matchday(): Promise<{ snapshot: FootballSnapshot; during: boolean }> {
  const snapshot = await footballNow();
  return { snapshot, during: duringGameweek(snapshot, new Date().toISOString()) };
}

export default async function MatchdayPage() {
  const { snapshot, during } = await matchday();

  // The tab is hidden between gameweeks, but the route still has to answer:
  // someone lands here from a bookmark, or is reading it when the last match
  // ends. A redirect would take the page out from under them; a `Nothing` would
  // claim something failed. Neither is true, so it says where the football went.
  // The head-to-head leads either way. Between rounds it is the pairing without
  // a score, which is the honest version of "who am I playing next" — and it is
  // the same component, so the one that matters on Saturday is the one that has
  // been on screen all week.
  return (
    <div className="flex flex-col gap-4">
      <YourMatchup />
      {during ? <GameweekView snapshot={snapshot} /> : <BetweenGameweeks snapshot={snapshot} />}
    </div>
  );
}

function BetweenGameweeks({ snapshot }: { snapshot: FootballSnapshot }) {
  const next = [...snapshot.fixtures]
    .filter((fixture) => fixture.kickoff !== null && fixture.status !== "finished")
    .sort((a, b) => String(a.kickoff).localeCompare(String(b.kickoff)))[0];

  // The round in view is the one FPL is pointing at, and after the last whistle
  // it keeps pointing at it until FPL moves on — hours, sometimes a day. In that
  // window nothing here is "next": the round is over, its kickoff has been and
  // gone, and its deadline is in the past. Saying so beats naming a finished
  // round as the one coming up.
  const over = next === undefined;

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="No football today"
        sub={over ? `Gameweek ${snapshot.gameweek} is done` : `Gameweek ${snapshot.gameweek} next`}
      />

      <div className="elev flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        {next?.kickoff ? (
          <p className="text-sm text-muted">
            First kickoff{" "}
            <span className="numeric font-semibold text-ink">{londonDayAndTime(next.kickoff)}</span>.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Every match in this round has been played. The next one appears here once FPL names
            its fixtures.
          </p>
        )}
        {/* Only worth saying while it is still ahead of us. */}
        {!over && snapshot.deadline ? (
          <p className="text-sm text-muted">
            FPL&apos;s deadline is{" "}
            <span className="numeric text-ink">{londonDayAndTime(snapshot.deadline)}</span>. Ours is
            the commissioner&apos;s, and it is on the League tab.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <ButtonLink href={`/gw/${snapshot.gameweek}`} fill>
          The fixtures
        </ButtonLink>
        <ButtonLink href="/league/matchups" fill>
          Who plays whom
        </ButtonLink>
      </div>
    </div>
  );
}
