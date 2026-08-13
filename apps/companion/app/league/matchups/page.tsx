import Link from "next/link";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type LeagueTeam,
  type LiveTeamScore,
  fetchLiveScoring,
  mapLiveScores,
  periodPairings,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import PageHeader from "../../components/shell/PageHeader";
import SectionNav from "../SectionNav";
import { getLeagueSquads } from "../../squad/league";
import { orRefusal } from "../../refusals";

// Who each squad plays this period, and what they have scored.
//
// The score is Fantrax's own. `getLiveScoringStats` answers without a cookie and
// returns typed totals for every team in one call (PLATFORM_NOTES, 13 Aug), so
// this page reports the competition's real numbers rather than an estimate of
// them — and we still compute no scoring, which was always the doctrine.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

/** Fantrax's totals for this period, or none.
 *
 *  Failure-tolerant on purpose: a scoreboard we cannot read costs the numbers,
 *  not the page. Who plays whom comes from a different read and is still worth
 *  showing on its own. */
async function liveScores(period: number): Promise<Map<string, LiveTeamScore>> {
  const raw = await orRefusal(fetchLiveScoring(FANTRAX_LEAGUE_ID, period));
  if (raw instanceof FantraxError) return new Map();
  return new Map(mapLiveScores(raw).map((score) => [score.teamId, score]));
}

function Side({ team, score }: { team: LeagueTeam; score: LiveTeamScore | undefined }) {
  return (
    <Link
      href={`/squad/${team.teamId}`}
      className="flex min-h-11 items-center gap-3 px-3 py-2 hover:bg-raised"
    >
      <span className="min-w-0 flex-1 truncate font-semibold">{team.name}</span>
      {/* Per side, not per league: once football is on, one manager has three
          players left and the other has none, and that difference is most of
          what a head-to-head screen is for. */}
      {score?.toPlay ? (
        <span className="shrink-0 text-2xs text-faint">{score.toPlay} to play</span>
      ) : null}
      {/* A team we have no number for gets a dash, never a nought: those are
          different claims and only one of them is a score. */}
      <span className="numeric w-10 text-right text-lg font-bold">{score?.points ?? "—"}</span>
    </Link>
  );
}

export default async function MatchupPage() {
  const squads = await getLeagueSquads();

  if ("unavailable" in squads) {
    return (
      <Nothing title="Fantrax is not answering" code={squads.unavailable}>
        The schedule is part of the league&apos;s own description of itself, and we cannot read it
        right now.
      </Nothing>
    );
  }

  if ("undrafted" in squads) {
    return (
      <Nothing title="Nobody plays anybody yet" code={squads.undrafted}>
        A schedule needs teams in it. Until the draft, Fantrax has pairings for nobody, so there is
        no matchup to show.
      </Nothing>
    );
  }

  const { period } = squads.period;
  if (squads.info === null || period === null) {
    return (
      <Nothing title="No schedule to read">
        Fantrax answered the rosters but would not say which period it is or who plays whom, and a
        matchup page that guessed either would be making its fixtures up.
      </Nothing>
    );
  }

  const pairings = periodPairings(squads.info.matchups, squads.info.teams, period);
  if (pairings.length === 0) {
    return (
      <Nothing title="No pairings this period" code={`period ${period}`}>
        The schedule does not cover this period — a bye week, or a season that has not reached its
        first head-to-head yet. Nobody is hiding anything; there is nothing to pair.
      </Nothing>
    );
  }

  const scores = await liveScores(period);

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Matchups"
        sub={
          <>
            Period {period} · Gameweek {squads.snapshot.gameweek}
          </>
        }
      />
      <SectionNav current="matchups" />

      {/* Provenance at the point of use, per principle 4. These are Fantrax's
          points under Fantrax's scoring; we add nothing up. */}
      <p className="px-3 text-2xs text-faint">
        Fantrax&apos;s points, under Fantrax&apos;s scoring. We add nothing up.
      </p>

      <ul className="flex flex-col gap-1.5">
        {pairings.map((pairing) => (
          <li key={`${pairing.home.teamId}-${pairing.away.teamId}`}>
            <div className="elev flex flex-col rounded-xl border border-line bg-surface py-1">
              <Side team={pairing.home} score={scores.get(pairing.home.teamId)} />
              <span className="px-3 text-center text-2xs font-bold uppercase tracking-widest text-faint">
                vs
              </span>
              <Side team={pairing.away} score={scores.get(pairing.away.teamId)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
