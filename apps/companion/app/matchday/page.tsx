import ButtonLink from "../components/shell/ButtonLink";
import {
  type Fixture,
  type FootballSnapshot,
  duringGameweek,
  fixtureInvolvement,
  owners,
} from "@epl/core";
import { footballNow } from "../football";
import GameweekView from "../components/football/GameweekView";
import Afternoon from "./Afternoon";
import YourMatchup from "./YourMatchup";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
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
  const league = await marks(snapshot.fixtures);

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
      {/* Under the scoreline, because it is the same question asked forwards:
          the card says where you are, this says what is left to change it. */}
      <Afternoon snapshot={snapshot} players={league.afternoon} />
      {during ? (
        <GameweekView snapshot={snapshot} mine={league.mine} owners={league.owners} />
      ) : (
        <BetweenGameweeks snapshot={snapshot} />
      )}
    </div>
  );
}

/** What our league has to say about this round: which fixtures the reader has
 *  somebody in, who holds each footballer, and — separately — the reader's
 *  ACTIVE men, which is the afternoon still ahead of him.
 *
 *  Two different squads on purpose. The fixture markers key off **membership**,
 *  which is public all week and is the right answer to "is this match mine".
 *  The afternoon strip keys off his **lineup**, because a reserve does not
 *  score — and his own lineup is never withheld from him, so nothing here is
 *  readable about anybody else.
 *
 *  All three absent when there is no answer to give: signed out, undrafted, or
 *  Fantrax silent. The page then renders exactly as it did before, which is what
 *  keeps "this half works with no Fantrax at all" true. */
async function marks(fixtures: readonly Fixture[]) {
  const squads = await getLeagueSquads();
  if ("undrafted" in squads || "unavailable" in squads) return {};

  const teamId = await myTeamId(squads.period.teams);
  const team = squads.period.teams.find((t) => t.teamId === teamId);

  return {
    mine: team === undefined ? undefined : fixtureInvolvement(team, fixtures),
    owners: owners(squads.period.teams),
    afternoon:
      team === undefined
        ? undefined
        : fixtureInvolvement(
            { ...team, players: team.players.filter((p) => p.slot.status === "ACTIVE") },
            fixtures,
          ),
  };
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
