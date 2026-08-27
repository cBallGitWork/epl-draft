import { notFound, redirect } from "next/navigation";
import {
  FANTRAX_APP_BASE,
  FANTRAX_LEAGUE_ID,
  clubById,
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
import Sheet from "./Sheet";
import { pollSeconds } from "../../football";
import { getLeagueSquads, roundOf, teamDisplay } from "../../squads";
import { squadLivePoints } from "../../scoreboard";
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
  /** Which round's squad. Absent means the one Fantrax is currently pointing at,
   *  which is every arrival from the table, the matchup card and the squad list.
   *  The schedule sends a gameweek, so tapping a side in a March fixture opens
   *  March's fifteen rather than this week's — which is the only useful thing
   *  about a fixture in March, and was the one thing that row did not do. */
  searchParams: Promise<{ gw?: string }>;
}) {
  const [{ teamId }, { gw }] = await Promise.all([params, searchParams]);

  // Through the calendar seam, never by taking one number for the other: the
  // period is what Fantrax is asked for and the gameweek is what FPL is asked
  // for. Same resolution the head-to-head route makes.
  const asked = Number(gw);
  const round = Number.isInteger(asked) ? await roundOf(asked) : null;
  const squads = await getLeagueSquads(round);
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
    squads.info !== null && squads.roundPeriod !== null
      ? headToHead(squads.info.matchups, squads.info.teams, squads.roundPeriod, teamId)?.opponent
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

  // What our league scores each of them, and the two branches below read it from
  // different places on purpose.
  //
  // With the gate OPEN the numbers come off the live scoreboard, priced at the
  // slot each man is filling and scoped to this period — the only per-player
  // figure Fantrax publishes that agrees with the total on their own board.
  //
  // With the gate CLOSED they cannot: that payload is keyed by the eleven, so
  // reading it here would rebuild the arrangement this branch exists to
  // withhold. The season table names all fifteen and says nothing about how they
  // are arranged, which is exactly what a withheld squad wants — and it is a
  // season total, which is why it is still labelled as one.
  //
  // Joining the squad to its clubs and fixtures happens here either way, on the
  // server: it is pure and tested in core, and doing it in the browser would
  // mean shipping every club and every fixture in the round for fifteen lookups.
  // One value rather than a period beside a flag, for the same reason `planning`
  // above is one: there is then no arrangement of the two that type-checks and
  // still asks the live scoreboard for a period nobody named.
  const priced =
    display.show === "lineup" && squads.roundPeriod !== null && squads.info !== null
      ? { period: squads.roundPeriod, categories: squads.info.scoringCategories }
      : null;
  const live = priced === null
    ? null
    : await squadLivePoints(priced.period, teamId, priced.categories);
  // Tied to the branch that LABELS it a season total, not to the absence of the
  // live one. `priced` also needs `squads.info`, so with `getLeagueInfo` refused
  // — a modelled, separately-cached state — an own-team lineup fell through to
  // the season table and `Sheet` rendered it under a card headed "This period",
  // at a man's default position rather than his roster slot. This is the same
  // condition `board` is built on, so the two cannot disagree.
  const season = display.show === "squad" ? await squadPoints(teamId) : null;
  const points = (live?.points ?? season?.points) ?? null;
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
      <AutoRefresh seconds={pollSeconds(squads.snapshot)} />
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
            Period {squads.roundPeriod ?? "—"} · Gameweek {squads.snapshot.gameweek}
            {display.show === "squad" ? " · squad" : null}
          </>
        }
      />

      {planning !== null ? (
        <LineupPlanner
          team={team}
          // The whole squad's detail, flat: the planner rearranges it in the
          // browser, so it cannot be handed lines grouped on the server.
          //
          // Points were `null` here, which made your own squad the one pitch in
          // the app printing minutes where every other printed what our league
          // scores him. A man's points are a fact about him and not about the
          // arrangement, so rearranging cannot disturb them.
          details={team.players.map((rostered) =>
            playerDetail(rostered, clubs, opposition, points),
          )}
          // Fifteen players' eligibility, not the pool's 697. This crosses to
          // the browser, and the other 682 are not this manager's business.
          players={planning.players.filter((p) => squadIds.has(p.fantraxId))}
          limits={planning.roster}
          fantraxUrl={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}`}
        />
      ) : board !== null ? (
        /* The gate. Before his lineups lock a rival's XI is not visible — the
           shape and the active/reserve split are withheld together. The squad
           itself is not: fifteen names, who they play this week, and nothing
           about how they will be arranged.

           Branching on the board rather than on the display again: it exists
           exactly when the gate is closed, so there is no arrangement of the two
           that renders a board with nothing on it. */
        <SquadBoard lines={board.lines} because={board.because} projected={board.projected} />
      ) : (
        /* A rival's XI, once his lineups have locked. Read-only: it is his — but
           every man on it opens the same card the head-to-head board opens, so
           "why is he on 12" has one answer wherever it is asked.

           Arranged here and only here: this is the branch where the lineup is
           public, and building it on the others would be work whose only product
           is a payload nobody may read. The spread is the arrangement itself —
           `rows` and `bench`, which is the whole of what the join returns. */
        <Sheet
          {...lineupDetail(team, clubs, opposition, points)}
          lines={squadDetail(squadUnarranged(team), clubs, opposition, points)}
          breakdown={live?.breakdown ?? {}}
        />
      )}
    </div>
  );
}
