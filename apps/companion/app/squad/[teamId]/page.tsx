import Link from "next/link";
import ButtonLink from "../../components/shell/ButtonLink";
import { notFound, redirect } from "next/navigation";
import {
  FANTRAX_APP_BASE,
  FANTRAX_LEAGUE_ID,
  clubById,
  oppositionByClub,
  periodPairings,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import type { Club, FootballSnapshot, RosteredTeam, SquadDetailLine, SquadReason } from "@epl/core";
import LineupPlanner from "../../components/league/LineupPlanner";
import PageHeader from "../../components/shell/PageHeader";
import Pitch from "../../components/league/Pitch";
import SquadBoard from "../../components/league/SquadBoard";
import { getLeagueSquads, mayPreviewLineups } from "../../squads";
import { squadPoints } from "../../teamStats";
import { myTeamId } from "../../session";

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

  // Whose squad this is. Most visits to this route are to somebody else's — the
  // matchup card and the squad list both lead here — and the two readings want
  // different things said, so the page knows which it is serving.
  const mine = (await myTeamId(squads.period.teams)) === teamId;

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
  // The rules the planner would enforce, or null when it may not open — because
  // this is a rival's squad and rearranging it is not yours to do, because this
  // league never previews, because the request did not ask, or because Fantrax
  // would not tell us the rules. One value rather than a flag beside a nullable,
  // so there is no arrangement of the two that type-checks and still opens the
  // planner with nothing to enforce.
  const planning = mine && query.preview === "1" && mayPreviewLineups() ? squads.info : null;
  const squadIds = new Set(team.players.map((p) => p.slot.fantraxId));

  // The board is the only view that wants points, and `getTeamRosterInfo` is a
  // request — so it is asked for only when the board is what renders. Joining
  // the squad to its clubs and fixtures happens here too, on the server: it is
  // pure and tested in core, and doing it in the browser would mean shipping
  // every club and every fixture in the round for fifteen lookups.
  const board =
    planning === null && squads.display.show === "squad"
      ? await squadBoard(teamId, team, squads.snapshot, clubs, squads.display.because)
      : null;

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title={mine ? `${team.teamName} — your squad` : team.teamName}
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
      ) : board !== null ? (
        /* The gate. Before a period opens nobody's XI is visible — not a rival's
           and not your own — so the shape and the active/reserve split are
           withheld together. The squad itself is not: fifteen names, who they
           play this week, and nothing about how they will be arranged.

           Branching on the board rather than on the display again: it exists
           exactly when the gate is closed, so there is no arrangement of the two
           that renders a board with nothing on it. */
        <SquadBoard lines={board.lines} because={board.because} projected={board.projected} />
      ) : (
        <Pitch team={team} clubs={clubs} />
      )}

      <ButtonLink href="/squad">Every squad</ButtonLink>
    </div>
  );
}

/** The squad as the board renders it: its lines joined to the clubs they play
 *  for, the fixtures they have this round, and what our league scores them.
 *
 *  Points are an extra on a page that already has something to say, so a Fantrax
 *  refusal costs the column and nothing else — the real league refuses this
 *  endpoint until it has teams. */
async function squadBoard(
  teamId: string,
  team: RosteredTeam,
  snapshot: FootballSnapshot,
  clubs: Map<number, Club>,
  because: SquadReason,
): Promise<{ lines: SquadDetailLine[]; projected: boolean; because: SquadReason }> {
  const season = await squadPoints(teamId);
  return {
    because,
    lines: squadDetail(
      squadUnarranged(team),
      clubs,
      oppositionByClub(snapshot),
      season?.points ?? null,
    ),
    projected: season?.projected ?? false,
  };
}
