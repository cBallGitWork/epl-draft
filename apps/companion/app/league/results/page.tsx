import { periodPairings } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import LeagueShell from "../Shell";
import Result from "./Result";
import RoundHead from "../../components/shell/RoundHead";
import { getSchedule, getSeasonResults } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import FantraxSilent from "../../components/shell/FantraxSilent";

// What has already happened: every played round, newest first, each round's
// head-to-heads as scorelines.
//
// **CM's second tab** (`cm9900/24.jpg` runs `Table · Results · Fixtures ·
// Schedule`) and the fourth blue button Craig asked for on 31 Aug. It is a view
// of the season rather than a new read of it: `getSchedule` already numbers the
// rounds and says which have started, and `getSeasonResults` is already cached
// because the table's form guide is built from it. This page adds no provider
// call at all.
//
// **Why it is not just the schedule scrolled back.** `/league/schedule` answers
// "what is on this week" — one round at a time, with the competitions we invent
// layered over Fantrax's fixture, and a control to move between them. This
// answers "what has happened", which is a different question and a different
// shape: no round picker, no cup, newest first, and nothing on it that has not
// been played. Both are the same two payloads and neither is the other's filter.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function ResultsPage() {
  const [schedule, results, mine] = await Promise.all([
    getSchedule(),
    getSeasonResults(),
    // `readerTeamId` and not `myTeamId`: this page has not narrowed the squads
    // itself, so it wants the cached lookup that validates a cookie against the
    // league we are actually serving.
    readerTeamId(),
  ]);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell current="results">
        <FantraxSilent code={schedule.unavailable}>
          The season is theirs to keep, and we cannot read it right now.
        </FantraxSilent>
      </LeagueShell>
    );
  }

  const { info, rounds, table } = schedule;

  // Fantrax's own rank, for CM's blue block. TODAY's standing rather than the
  // one each side held on the week of the result — the table is a running order
  // and this app keeps no history of it, so a row says where a manager is now
  // and not where he was in September.
  const places = new Map(table.map((row) => [row.teamId, row.rank] as const));

  // Every team's total for a period, by period. Built once rather than filtered
  // per round: thirty-eight rounds each scanning the whole season is the shape
  // of a list that gets slow the week it gets long.
  const byPeriod = new Map<number, Map<string, number | null>>();
  for (const result of results) {
    const period = byPeriod.get(result.period) ?? new Map<string, number | null>();
    period.set(result.teamId, result.points);
    byPeriod.set(result.period, period);
  }

  // **Finished, and not merely started** — see `gameweekStatus` in core. The
  // first cut filtered on `started` and the round in play came out top of the
  // list with its half-time scores presented as results. A round still running
  // is on Matchups and on Live, which is where a number that moves belongs; this
  // page is the archive and everything on it is final.
  //
  // `byPeriod.has` as well, because a finished round Fantrax has not scored is
  // not a round of 0-0 draws — `PeriodResult.points` is null exactly when the
  // cell could not be read, and absence is never a nought.
  const played = rounds
    .filter((round) => round.status === "finished" && byPeriod.has(round.period))
    .reverse();

  if (played.length === 0) {
    return (
      <LeagueShell current="results" teams={info.teams.length}>
        <Nothing title="Nothing played yet" code="no started round has a result">
          {info.name} has results here as soon as a round finishes. A round still being
          played is on Matchups, where its score is meant to move.
        </Nothing>
      </LeagueShell>
    );
  }

  return (
    <LeagueShell current="results" teams={info.teams.length}>
      <div className="flex flex-col gap-3">
        {played.map((round) => (
          <section key={round.period} className="flex flex-col">
            <RoundHead gameweek={round.gameweek} />
            <div className="cm-rows flex flex-col">
              {periodPairings(info.matchups, info.teams, round.period).map((pairing) => (
                <Result
                  key={`${pairing.home.teamId}-${pairing.away.teamId}`}
                  pairing={pairing}
                  points={byPeriod.get(round.period) ?? EMPTY}
                  gameweek={round.gameweek}
                  places={places}
                  mine={mine}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </LeagueShell>
  );
}

/** Hoisted rather than written inline: a `new Map()` in the render would be a
 *  fresh object per pairing per round, and the filter above already guarantees
 *  the lookup succeeds — this exists to satisfy the type, not to be reached. */
const EMPTY: Map<string, number | null> = new Map();
