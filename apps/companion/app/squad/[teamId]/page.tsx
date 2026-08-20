import { notFound, redirect } from "next/navigation";
import {
  FANTRAX_APP_BASE,
  FANTRAX_LEAGUE_ID,
  POLL,
  clubById,
  duringGameweek,
  headToHead,
  lineupDetail,
  oppositionByClub,
  playerDetail,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import AutoRefresh from "../../components/shell/AutoRefresh";
import LineupPlanner from "../../components/league/LineupPlanner";
import PageHeader from "../../components/shell/PageHeader";
import SquadBoard from "../../components/league/SquadBoard";
import TeamSheet from "../../components/league/TeamSheet";
import { getLeagueSquads, teamDisplay } from "../../squads";
import { squadPoints } from "../../teamStats";
import { myTeamId } from "../../session";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
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
  const opponent =
    squads.info !== null && squads.period.period !== null
      ? headToHead(squads.info.matchups, squads.info.teams, squads.period.period, teamId)?.opponent
      : undefined;

  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  // What this reader may see of THIS team, which is not the league-wide answer:
  // your own lineup is yours all week, a rival's waits for his period to open.
  const display = teamDisplay(squads, mine);

  // The rules the planner enforces, or null when it may not open — because this
  // is a rival's squad and rearranging it is not yours to do, or because Fantrax
  // would not tell us the rules and a planner that cannot enforce a cap is worse
  // than none. One value rather than a flag beside a nullable, so there is no
  // arrangement of the two that type-checks and still opens the planner with
  // nothing to enforce.
  const planning = mine && display.show === "lineup" && squads.info !== null ? squads.info : null;
  const squadIds = new Set(team.players.map((p) => p.slot.fantraxId));

  // What our league scores each of them this period. Both views want it now —
  // the board as a column, the pitch as the number under each face — so it is
  // one read rather than one per view. A refusal costs the numbers and nothing
  // else. Joining the squad to its clubs and fixtures happens here too, on the
  // server: it is pure and tested in core, and doing it in the browser would
  // mean shipping every club and every fixture in the round for fifteen lookups.
  const season = await squadPoints(teamId, squads.period.period ?? undefined);
  const points = season?.points ?? null;
  const board =
    display.show === "squad"
      ? {
          because: display.because,
          projected: season?.projected ?? false,
          lines: squadDetail(squadUnarranged(team), clubs, opposition, points),
        }
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* The only live-points surface that did not move on a Saturday. Both
          arrangements below carry Fantrax's totals and FPL's minutes, and
          `revalidate` bounds staleness without pushing anything to a phone
          already open on the sofa. Same cadence as the head-to-head board that
          shows the same numbers. */}
      <AutoRefresh
        seconds={duringGameweek(squads.snapshot, new Date().toISOString()) ? POLL.live : POLL.idle}
      />
      {/* Who he plays belongs on the same line as who he is. It had a line of
          its own under the period, which is where a reader looks last. */}
      <PageHeader
        title={[
          mine ? `${team.teamName} — your squad` : team.teamName,
          opponent ? `vs ${opponent.name}` : null,
        ]
          .filter(Boolean)
          .join(" ")}
        sub={
          <>
            Period {squads.period.period ?? "—"} · Gameweek {squads.snapshot.gameweek}
            {display.show === "squad" ? " · squad" : null}
          </>
        }
      />

      {planning !== null ? (
        <LineupPlanner
          team={team}
          // The whole squad's detail, flat: the planner rearranges it in the
          // browser, so it cannot be handed lines grouped on the server.
          details={team.players.map((rostered) =>
            playerDetail(rostered, clubs, opposition, null),
          )}
          // Fifteen players' eligibility, not the pool's 697. This crosses to
          // the browser, and the other 682 are not this manager's business.
          players={planning.players.filter((p) => squadIds.has(p.fantraxId))}
          limits={planning.roster}
          fantraxUrl={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}`}
        />
      ) : board !== null ? (
        /* The gate. Before his period opens a rival's XI is not visible — the
           shape and the active/reserve split are withheld together. The squad
           itself is not: fifteen names, who they play this week, and nothing
           about how they will be arranged.

           Branching on the board rather than on the display again: it exists
           exactly when the gate is closed, so there is no arrangement of the two
           that renders a board with nothing on it. */
        <SquadBoard lines={board.lines} because={board.because} projected={board.projected} />
      ) : (
        /* A rival's XI, once his period has opened. Read-only: it is his — but
           every man on it opens the same card the head-to-head board opens, so
           "why is he on 12" has one answer wherever it is asked.

           Arranged here and only here: this is the branch where the lineup is
           public, and building it on the others would be work whose only product
           is a payload nobody may read. The spread is the arrangement itself —
           `rows` and `bench`, which is the whole of what the join returns. */
        <TeamSheet
          {...lineupDetail(team, clubs, opposition, points)}
          lines={squadDetail(squadUnarranged(team), clubs, opposition, points)}
          breakdown={season?.breakdown ?? {}}
          projected={season?.projected ?? false}
          mode="pitch"
        />
      )}
    </div>
  );
}
