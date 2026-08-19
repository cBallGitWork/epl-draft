import Link from "next/link";
import ButtonLink from "../../components/shell/ButtonLink";
import { notFound, redirect } from "next/navigation";
import { FANTRAX_APP_BASE, FANTRAX_LEAGUE_ID, clubById, periodPairings } from "@epl/core";
import LineupPlanner from "../../components/league/LineupPlanner";
import PageHeader from "../../components/shell/PageHeader";
import Pitch from "../../components/league/Pitch";
import SquadList from "../../components/league/SquadList";
import { getLeagueSquads, mayPreviewLineups } from "../league";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const [{ teamId }, query] = await Promise.all([params, searchParams]);
  const squads = await getLeagueSquads();
  // No squads exist and no such team: both are genuinely 404. Fantrax being
  // unreachable is not — that is a state of ours, and it belongs on /team where
  // it is described rather than behind a status code.
  if ("undrafted" in squads) notFound();
  if ("unavailable" in squads) redirect("/squad");

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  // This manager's pairing, so the squad screen says who Saturday is against.
  // Undefined is ordinary — no schedule for this period, or Fantrax would not
  // describe the league — and renders as no line rather than a guess.
  const pairing =
    squads.info !== null && squads.period.period !== null
      ? periodPairings(squads.info.matchups, squads.info.teams, squads.period.period).find(
          (p) => p.home.teamId === teamId || p.away.teamId === teamId,
        )
      : undefined;
  const opponent = pairing === undefined ? undefined : pairing.home.teamId === teamId ? pairing.away : pairing.home;

  const clubs = clubById(squads.snapshot);
  // The rules the planner would enforce, or null when it may not open — either
  // because this league never previews, because the request did not ask, or
  // because Fantrax would not tell us the rules. One value rather than a flag
  // beside a nullable, so there is no arrangement of the two that type-checks
  // and still opens the planner with nothing to enforce.
  const planning = query.preview === "1" && mayPreviewLineups() ? squads.info : null;
  const squadIds = new Set(team.players.map((p) => p.slot.fantraxId));

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title={team.teamName}
        sub={
          <>
            Period {squads.period.period ?? "—"} · Gameweek {squads.snapshot.gameweek}
            {squads.display.show === "squad" && planning === null ? " · squad" : null}
          </>
        }
      >
        {opponent ? (
          <Link href="/league/matchups" className="text-2xs font-medium text-muted hover:underline">
            vs {opponent.name}
          </Link>
        ) : null}
      </PageHeader>

      {planning !== null ? (
        <>
          {/* Loud on purpose. This is a lineup the gate would be hiding, shown
              only because the league it belongs to has no real managers in it. */}
          <p className="rounded-lg border border-line bg-raised px-3 py-2 text-2xs text-mid">
            Preview — the rehearsal league only. In the real league this lineup stays hidden until
            the gameweek starts.
          </p>
          <LineupPlanner
            team={team}
            clubs={clubs}
            // Fifteen players' eligibility, not the pool's 697. This crosses to
            // the browser, and the other 682 are not this manager's business.
            players={planning.players.filter((p) => squadIds.has(p.fantraxId))}
            limits={planning.roster}
            fantraxUrl={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}`}
          />
        </>
      ) : squads.display.show === "lineup" ? (
        <Pitch team={team} clubs={clubs} />
      ) : (
        /* The gate. Before a period opens nobody's XI is visible — not a rival's
           and not your own — so the pitch, the shape and the active/reserve split
           are all withheld together. */
        <SquadList team={team} clubs={clubs} because={squads.display.because} />
      )}

      <ButtonLink href="/squad">Every squad</ButtonLink>
    </div>
  );
}
