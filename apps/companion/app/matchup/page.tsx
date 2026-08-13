import Link from "next/link";
import {
  type PeriodPairing,
  type PlayerMatchStats,
  type RosteredTeam,
  isActive,
  isResolved,
  periodPairings,
} from "@epl/core";
import LeagueCrest from "../components/shell/LeagueCrest";
import Nothing from "../components/shell/Nothing";
import { getLeagueSquads } from "../team/league";

// Who each squad plays this period. The Saturday screen — and deliberately not a
// scoreboard: getMatchups is behind a login (probed 13 Aug), so Fantrax's live
// totals are not ours to show, and we never compute their scoring ourselves. A
// pairing plus each side's countable events is what we genuinely know.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

/** What one team's eleven has countably done, summed from the same stat rows the
 *  stickers draw. Active players only: a reserve's goal does not play in the
 *  matchup, and this is only ever computed once the gate shows lineups — before
 *  the period opens the split itself is hidden, so there is nothing to sum. */
function events(team: RosteredTeam): { label: string; count: number }[] {
  const starters = team.players.filter(isResolved).filter((p) => isActive(p.slot));
  const sum = (pick: (s: PlayerMatchStats) => number) =>
    starters.reduce((total, p) => total + p.stats.reduce((n, s) => n + pick(s), 0), 0);
  return [
    { label: "G", count: sum((s) => s.goals) },
    { label: "A", count: sum((s) => s.assists) },
    { label: "CS", count: starters.filter((p) => p.stats.length > 0 && p.stats.every((s) => s.cleanSheet)).length },
    { label: "YC", count: sum((s) => s.yellowCards) },
    { label: "RC", count: sum((s) => s.redCards) },
  ];
}

function Side({ team, roster, open }: { team: { teamId: string; name: string }; roster: RosteredTeam | undefined; open: boolean }) {
  const counts = open && roster ? events(roster).filter((e) => e.count > 0) : [];
  return (
    <Link href={`/team/${team.teamId}`} className="flex min-h-11 items-center gap-3 px-3 py-2 hover:bg-raised">
      <span className="min-w-0 flex-1 truncate font-semibold">{team.name}</span>
      <span className="numeric text-sm text-muted">
        {counts.length > 0 ? counts.map((e) => `${e.label} ${e.count}`).join(" · ") : "—"}
      </span>
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

  const { period, teams } = squads.period;
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

  const rosters = new Map(teams.map((team) => [team.teamId, team]));
  const open = squads.display.show === "lineup";

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2.5 pt-1">
        <LeagueCrest height={26} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight">Matchups</h1>
          <p className="numeric text-2xs text-faint">
            Period {period} · Gameweek {squads.snapshot.gameweek}
          </p>
        </div>
      </header>

      {/* Honest label, not small print: these are the events we can count from
          FPL's public feed. The points belong to Fantrax and appear on Fantrax. */}
      {open ? (
        <p className="px-3 text-2xs text-faint">Countable events, not points — the scoring is Fantrax&apos;s.</p>
      ) : null}

      <ul className="flex flex-col gap-1.5">
        {pairings.map((pairing: PeriodPairing) => (
          <li key={`${pairing.home.teamId}-${pairing.away.teamId}`}>
            <div className="elev flex flex-col rounded-xl border border-line bg-surface py-1">
              <Side team={pairing.home} roster={rosters.get(pairing.home.teamId)} open={open} />
              <span className="px-3 text-center text-2xs font-bold uppercase tracking-widest text-faint">
                vs
              </span>
              <Side team={pairing.away} roster={rosters.get(pairing.away.teamId)} open={open} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
