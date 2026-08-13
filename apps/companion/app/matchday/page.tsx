import Link from "next/link";
import { type FootballSnapshot, duringGameweek, getFootballSnapshot } from "@epl/core";
import GameweekView from "../components/football/GameweekView";
import PageHeader from "../components/shell/PageHeader";
import { londonDayAndTime } from "../londonTime";

// The live viewer. Runs entirely off FPL's public API, so it works from the first
// match of the season without Fantrax, a draft, or a single credential.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** The snapshot and whether there is football on. The clock is read here rather
 *  than in the component: a render is meant to be reproducible, and fetching is
 *  already where this page touches the world. */
async function matchday(): Promise<{ snapshot: FootballSnapshot; during: boolean }> {
  const snapshot = await getFootballSnapshot();
  return { snapshot, during: duringGameweek(snapshot, new Date().toISOString()) };
}

export default async function MatchdayPage() {
  const { snapshot, during } = await matchday();

  // The tab is hidden between gameweeks, but the route still has to answer:
  // someone lands here from a bookmark, or is reading it when the last match
  // ends. A redirect would take the page out from under them; a `Nothing` would
  // claim something failed. Neither is true, so it says where the football went.
  return during ? <GameweekView snapshot={snapshot} /> : <BetweenGameweeks snapshot={snapshot} />;
}

function BetweenGameweeks({ snapshot }: { snapshot: FootballSnapshot }) {
  const next = [...snapshot.fixtures]
    .filter((fixture) => fixture.kickoff !== null && fixture.status !== "finished")
    .sort((a, b) => String(a.kickoff).localeCompare(String(b.kickoff)))[0];

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="No football today" sub={`Gameweek ${snapshot.gameweek} next`} />

      <div className="elev flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        {next?.kickoff ? (
          <p className="text-sm text-muted">
            First kickoff{" "}
            <span className="numeric font-semibold text-ink">{londonDayAndTime(next.kickoff)}</span>.
          </p>
        ) : (
          <p className="text-sm text-muted">
            The next round has no confirmed kickoff yet — the fixtures are set, the times are not.
          </p>
        )}
        {snapshot.deadline ? (
          <p className="text-sm text-muted">
            FPL&apos;s deadline is{" "}
            <span className="numeric text-ink">{londonDayAndTime(snapshot.deadline)}</span>. Ours is
            the commissioner&apos;s, and it is on the League tab.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/gw/${snapshot.gameweek}`}
          className="min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
        >
          The fixtures
        </Link>
        <Link
          href="/league/matchups"
          className="min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
        >
          Who plays whom
        </Link>
      </div>
    </div>
  );
}
