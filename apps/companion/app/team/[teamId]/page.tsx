import Link from "next/link";
import { notFound } from "next/navigation";
import { clubById } from "@epl/core";
import LeagueCrest from "../../components/LeagueCrest";
import Pitch from "../../components/Pitch";
import { getLeagueSquads } from "../league";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const squads = await getLeagueSquads();
  if ("undrafted" in squads) notFound();

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
          </p>
        </div>
      </header>

      <Pitch team={team} clubs={clubById(squads.snapshot)} />

      <Link
        href="/team"
        className="min-h-11 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
      >
        Every squad
      </Link>
    </div>
  );
}
