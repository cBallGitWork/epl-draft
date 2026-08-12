import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clubById } from "@epl/core";
import LeagueCrest from "../../components/shell/LeagueCrest";
import Pitch from "../../components/league/Pitch";
import SquadList from "../../components/league/SquadList";
import { getLeagueSquads } from "../league";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const squads = await getLeagueSquads();
  // No squads exist and no such team: both are genuinely 404. Fantrax being
  // unreachable is not — that is a state of ours, and it belongs on /team where
  // it is described rather than behind a status code.
  if ("undrafted" in squads) notFound();
  if ("unavailable" in squads) redirect("/team");

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2.5 pt-1">
        <LeagueCrest height={26} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{team.teamName}</h1>
          <p className="numeric text-2xs text-faint">
            Period {squads.period.period ?? "—"} · Gameweek {squads.snapshot.gameweek}
            {squads.display.show === "squad" ? " · squad" : null}
          </p>
        </div>
      </header>

      {/* The gate. Before a period opens nobody's XI is visible — not a rival's
          and not your own — so the pitch, the shape and the active/reserve split
          are all withheld together. */}
      {squads.display.show === "lineup" ? (
        <Pitch team={team} clubs={clubById(squads.snapshot)} />
      ) : (
        <SquadList
          team={team}
          clubs={clubById(squads.snapshot)}
          because={squads.display.because}
        />
      )}

      <Link
        href="/team"
        className="min-h-11 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
      >
        Every squad
      </Link>
    </div>
  );
}
