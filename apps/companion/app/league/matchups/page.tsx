import Link from "next/link";
import {
  POLL,
  type LeagueTeam,
  type LiveTeamScore,
  type PeriodPairing,
  type PendingCleanSheets,
  duringGameweek,
  periodPairings,
} from "@epl/core";
import AutoRefresh from "../../components/shell/AutoRefresh";
import Nothing from "../../components/shell/Nothing";
import LeagueShell from "../Shell";
import { getLeagueSquads } from "../../squads";
import { myTeamId } from "../../session";
import { liveScores, pendingByTeam } from "../../scoreboard";
import { yoursBorder } from "../../mine";
import { FANTRAX_SILENT } from "../../config";

// Who each squad plays this period, and what they have scored.
//
// The score is Fantrax's own. `getLiveScoringStats` answers without a cookie and
// returns typed totals for every team in one call (PLATFORM_NOTES, 13 Aug), so
// this page reports the competition's real numbers rather than an estimate of
// them — and we still compute no scoring, which was always the doctrine.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Whether a manager has a stake in this pairing. Null team id — a reader who
 *  has not signed in — has a stake in none of them, which is the neutral list. */
function involves(pairing: PeriodPairing, teamId: string | null): boolean {
  return teamId !== null && (pairing.home.teamId === teamId || pairing.away.teamId === teamId);
}

function Side({
  team,
  score,
  pending,
  mine,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  pending: PendingCleanSheets | undefined;
  mine: boolean;
}) {
  return (
    // Into the pairing's own board, opened on the side that was tapped — not
    // into the squad. Both sides of a card lead to the same head-to-head and it
    // arrives showing whichever name the thumb landed on, which is the whole of
    // what "tap a team" means here. Each squad is one further tap, from there.
    <Link
      href={`/league/matchups/${team.teamId}`}
      className="flex min-h-11 items-center gap-3 px-3 py-2 hover:bg-raised"
    >
      <span className={`min-w-0 flex-1 truncate ${mine ? "font-bold text-ink" : "font-semibold"}`}>
        {team.name}
      </span>
      {/* Per side, not per league: once football is on, one manager has three
          players left and the other has none, and that difference is most of
          what a head-to-head screen is for. */}
      {score?.toPlay ? (
        <span className="shrink-0 text-2xs text-faint">{score.toPlay} to play</span>
      ) : null}
      {/* Kept beside the score rather than folded into it. Fantrax's number stays
          Fantrax's; this is the bit they have not credited yet. */}
      {pending && pending.points > 0 ? (
        <span className="numeric shrink-0 text-sm font-semibold text-accent">
          +{pending.points}
        </span>
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
      <LeagueShell title="Matchups" current="matchups">
        <Nothing title={FANTRAX_SILENT} code={squads.unavailable}>
        Fantrax would not hand back the teams, so there is nobody to pair up.
        </Nothing>
      </LeagueShell>
    );
  }

  if ("undrafted" in squads) {
    return (
      <LeagueShell title="Matchups" current="matchups">
        <Nothing title="Nobody plays anybody yet" code={squads.undrafted}>
        A schedule needs teams in it. Until the draft, Fantrax has pairings for nobody, so there is
        no matchup to show.
        </Nothing>
      </LeagueShell>
    );
  }

  const { period } = squads.period;
  if (squads.info === null || period === null) {
    return (
      <LeagueShell title="Matchups" current="matchups">
        <Nothing title="No schedule to read">
        Fantrax answered the rosters but would not say which period it is or who plays whom, and a
        matchup page that guessed either would be making its fixtures up.
        </Nothing>
      </LeagueShell>
    );
  }

  const pairings = periodPairings(squads.info.matchups, squads.info.teams, period);
  if (pairings.length === 0) {
    return (
      <LeagueShell title="Matchups" current="matchups">
        <Nothing title="No pairings this period" code={`period ${period}`}>
        The schedule does not cover this period — a bye week, or a season that has not reached its
        first head-to-head yet. Nobody is hiding anything; there is nothing to pair.
        </Nothing>
      </LeagueShell>
    );
  }

  const mine = await myTeamId(squads.period.teams);
  const { scores, refused } = await liveScores(period);
  const pending = pendingByTeam(squads.period.teams, squads.info.scoring, squads.snapshot, squads.display);
  const owed = [...pending.values()].reduce((total, team) => total + team.players, 0);

  // Yours first. Sixteen pairings is a scroll, and the one a manager came for is
  // his own — a neutral list is for broadcasters.
  const ordered = [...pairings].sort(
    (a, b) => Number(involves(b, mine)) - Number(involves(a, mine)),
  );

  return (
    <LeagueShell
      title="Matchups"
      current="matchups"
      sub={
        <>
          Period {period} · Gameweek {squads.snapshot.gameweek}
        </>
      }
    >
      {/* The one live board that was not refreshing itself. `revalidate` bounds
          how stale the cache may get and pushes nothing to a phone already
          showing the score, so a device open on the sofa held a frozen scoreline
          for the whole afternoon while /matchday moved. */}
      <AutoRefresh
        seconds={duringGameweek(squads.snapshot, new Date().toISOString()) ? POLL.live : POLL.idle}
      />

      {/* Provenance at the point of use, per principle 4. These are Fantrax's
          points under Fantrax's scoring; we add nothing up. */}
      <p className="px-3 text-2xs text-faint">
        {refused === null ? (
          <>
            Fantrax&apos;s points, under Fantrax&apos;s scoring.
            {owed > 0
              ? " Green is clean sheets they credit at full time — ours to preview, theirs to settle."
              : null}
          </>
        ) : (
          <>
            Fantrax&apos;s scoreboard is not answering, so there are no points to show. The
            pairings below are still right. <span className="numeric">{refused}</span>
          </>
        )}
      </p>

      <ul className="flex flex-col gap-1.5">
        {ordered.map((pairing) => (
          <li key={`${pairing.home.teamId}-${pairing.away.teamId}`}>
            <div
              className={`elev flex flex-col rounded-xl border bg-surface py-1 ${yoursBorder(
                involves(pairing, mine),
              )}`}
            >
              <Side
                team={pairing.home}
                score={scores.get(pairing.home.teamId)}
                pending={pending.get(pairing.home.teamId)}
                mine={pairing.home.teamId === mine}
              />
              <span className="px-3 text-center text-2xs font-bold uppercase tracking-widest text-faint">
                vs
              </span>
              <Side
                team={pairing.away}
                score={scores.get(pairing.away.teamId)}
                pending={pending.get(pairing.away.teamId)}
                mine={pairing.away.teamId === mine}
              />
            </div>
          </li>
        ))}
      </ul>
    </LeagueShell>
  );
}
