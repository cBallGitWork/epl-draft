import { pairingInvolves, periodPairings, roundState } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import PairingCard from "./PairingCard";
import RoundWord from "../../components/league/RoundWord";
import LeagueShell from "../Shell";
import { getLeagueSquads } from "../../squads";
import { myTeamId } from "../../session";
import { liveScores, pendingByTeam } from "../../scoreboard";
import { teamBadges } from "../../standings";
import { roundUnderway } from "../../football";
import { yoursFirst } from "../../mine";
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

export default async function MatchupPage() {
  const squads = await getLeagueSquads();

  if ("unavailable" in squads) {
    return (
      <LeagueShell current="matchups">
        <Nothing title={FANTRAX_SILENT} code={squads.unavailable}>
        Fantrax would not hand back the teams, so there is nobody to pair up.
        </Nothing>
      </LeagueShell>
    );
  }

  if ("undrafted" in squads) {
    return (
      <LeagueShell current="matchups">
        <Nothing title="Nobody plays anybody yet" code={squads.undrafted}>
        A schedule needs teams in it. Until the draft, Fantrax has pairings for nobody, so there is
        no matchup to show.
        </Nothing>
      </LeagueShell>
    );
  }

  const period = squads.roundPeriod;
  if (squads.info === null || period === null) {
    return (
      <LeagueShell current="matchups">
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
      <LeagueShell current="matchups">
        <Nothing title="No pairings this period" code={`period ${period}`}>
        The schedule does not cover this period — a bye week, or a season that has not reached its
        first head-to-head yet. Nobody is hiding anything; there is nothing to pair.
        </Nothing>
      </LeagueShell>
    );
  }

  // The same pair of questions the head-to-head board asks, spelled the same way
  // and rendered by the same component.
  const state = roundState(squads.snapshot);
  // The card wants a different question from the state word: "all played" is
  // worth saying whenever the round is running, not only while a ball is in the
  // air. It used to ask `isMatchdayLive`, which is false in every gap between
  // kickoffs — and printed "4 to play" on the other side of the same line anyway.
  const underway = roundUnderway(squads.snapshot);

  const [mine, badges] = await Promise.all([myTeamId(squads.period.teams), teamBadges()]);
  const { scores, refused } = await liveScores(period);
  const pending = pendingByTeam(squads.period.teams, squads.info.scoring, squads.snapshot, squads.display);
  const owed = [...pending.values()].reduce((total, team) => total + team.players, 0);

  // Yours first. Sixteen pairings is a scroll, and the one a manager came for is
  // his own — a neutral list is for broadcasters.
  const ordered = yoursFirst(pairings, (pairing) => pairingInvolves(pairing, mine));

  return (
    <LeagueShell current="matchups"
      // Gameweek, not "Period 1 · Gameweek 1". They are the same number every
      // week this season, and printing one number under two names asks a reader
      // to work out whether they are the same thing.
      sub={
        <>
          Gameweek {squads.snapshot.gameweek}
          {state === null ? null : <> · <RoundWord state={state} /></>}
        </>
      }
    >
      {/* The one live board that was not refreshing itself. `revalidate` bounds
          how stale the cache may get and pushes nothing to a phone already
          showing the score, so a device open on the sofa held a frozen scoreline
          for the whole afternoon while /matchday moved. */}

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

      <ul className="cm-rows flex flex-col">
        {ordered.map((pairing) => (
          <li key={`${pairing.home.teamId}-${pairing.away.teamId}`}>
            <PairingCard
              pairing={pairing}
              scores={scores}
              pending={pending}
              badges={badges}
              mine={mine}
              underway={underway}
            />
          </li>
        ))}
      </ul>
    </LeagueShell>
  );
}
