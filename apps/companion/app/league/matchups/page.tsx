import { pairingInvolves, periodPairings, roundState } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import PairingCard from "./PairingCard";
import RoundWord from "../../components/league/RoundWord";
import LeagueShell from "../Shell";
import { getLeagueSquads } from "../../squads";
import { myTeamId } from "../../session";
import { liveScores, pendingByTeam } from "../../scoreboard";
import { leagueScoring } from "../../scoring";
import { roundUnderway } from "../../football";
import { yoursFirst } from "../../mine";
import FantraxSilent from "../../components/shell/FantraxSilent";
import ScoreboardDown from "../ScoreboardDown";

// Who each squad plays this gameweek and what they have scored: Fantrax's own totals, one call for every team.

export const revalidate = 30;

export default async function MatchupPage() {
  const squads = await getLeagueSquads();

  if ("unavailable" in squads) {
    return (
      <LeagueShell current="matchups">
        <FantraxSilent code={squads.unavailable}>
        Fantrax would not hand back the teams, so there is nobody to pair up.
        </FantraxSilent>
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
        Fantrax answered the rosters but would not say which gameweek it is or who plays whom, and a
        matchup page that guessed either would be making its fixtures up.
        </Nothing>
      </LeagueShell>
    );
  }

  const pairings = periodPairings(squads.info.matchups, squads.info.teams, period);
  if (pairings.length === 0) {
    return (
      <LeagueShell current="matchups">
        <Nothing title="No pairings this gameweek" code={`gameweek ${period}`}>
        The schedule does not cover this gameweek — a bye week, or a season that has not reached its
        first head-to-head yet. Nobody is hiding anything; there is nothing to pair.
        </Nothing>
      </LeagueShell>
    );
  }

  const state = roundState(squads.snapshot);
  // Under way, gaps between kickoffs included: "all played" is worth saying whenever the round is running.
  const underway = roundUnderway(squads.snapshot);

  const [mine, scoring] = await Promise.all([myTeamId(squads.period.teams), leagueScoring()]);
  const { scores, refused } = await liveScores(period);
  const pending = pendingByTeam(squads.period.teams, scoring?.rules ?? null, squads.snapshot, squads.display);
  const owed = [...pending.values()].reduce((total, team) => total + team.players, 0);

  // Yours first.
  const ordered = yoursFirst(pairings, (pairing) => pairingInvolves(pairing, mine));

  return (
    <LeagueShell current="matchups"
      // Gameweek, never period: one number under two names.
      sub={
        <>
          Gameweek {squads.snapshot.gameweek}
          {state === null ? null : <> · <RoundWord state={state} /></>}
        </>
      }
    >
      {/* Provenance where the figures are: Fantrax's points under Fantrax's scoring. */}
      {refused === null ? (
        <p className="px-3 text-2xs text-faint">
          Fantrax&apos;s points, under Fantrax&apos;s scoring.
          {owed > 0
            ? " Green is clean sheets they credit at full time — ours to preview, theirs to settle."
            : null}
        </p>
      ) : (
        <ScoreboardDown refused={refused}>The pairings below are still right.</ScoreboardDown>
      )}

      <ul className="cm-rows flex flex-col">
        {ordered.map((pairing) => (
          <li key={`${pairing.home.teamId}-${pairing.away.teamId}`}>
            <PairingCard
              pairing={pairing}
              scores={scores}
              pending={pending}
              mine={mine}
              underway={underway}
            />
          </li>
        ))}
      </ul>
    </LeagueShell>
  );
}
