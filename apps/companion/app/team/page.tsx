import Link from "next/link";
import { FANTRAX_LEAGUE_ID, FANTRAX_LEAGUES, LEAGUE_NAME, isResolved } from "@epl/core";
import LeagueCrest from "../components/shell/LeagueCrest";
import Nothing from "../components/shell/Nothing";
import { londonDate } from "../londonTime";
import { getLeagueSquads } from "./league";

// Every squad in the league. Until the draft this is the empty state, which is
// the state our real league is actually in and therefore the one that has to be
// designed rather than defaulted.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

/** Draft night for the league we are actually serving — §3 keeps season dates in
 *  config, and the two leagues draft nine weeks apart. */
const DRAFT_DATE = londonDate(
  FANTRAX_LEAGUES.find((l) => l.leagueId === FANTRAX_LEAGUE_ID)?.draftDate ?? "",
);

export default async function SquadsPage() {
  const squads = await getLeagueSquads();

  if ("unavailable" in squads) {
    return (
      <Nothing title="Fantrax is not answering" code={`getTeamRosters → ${squads.unavailable}`}>
        The league is fine. We just cannot read it right now, so rather than guess at your squad
        this says nothing.
      </Nothing>
    );
  }

  if ("undrafted" in squads) {
    return (
      <Nothing title="Nobody has a squad yet" code={`getTeamRosters → ${squads.undrafted}`}>
        {LEAGUE_NAME} drafts on {DRAFT_DATE}. Until then Fantrax has a competition and no teams in
        it, so there is nothing to line up.
      </Nothing>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2.5 pt-1">
        <LeagueCrest height={26} />
        <h1 className="text-xl font-bold tracking-tight">Squads</h1>
      </header>

      <ul className="flex flex-col gap-1.5">
        {squads.period.teams.map((team) => {
          const unresolved = team.players.filter((player) => !isResolved(player)).length;
          return (
            <li key={team.teamId}>
              <Link
                href={`/team/${team.teamId}`}
                className="elev flex min-h-14 items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:bg-raised"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">{team.teamName}</span>
                <span className="numeric text-sm text-muted">{team.players.length}</span>
                {/* Never silently short. A squad we cannot fully identify says so
                    here rather than rendering fourteen of fifteen on the pitch. */}
                {unresolved > 0 ? (
                  <span className="numeric rounded bg-raised px-1.5 py-0.5 text-2xs font-bold text-mid">
                    {unresolved} unmapped
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
