import {
  FANTRAX_LEAGUE_PAGE,
  FANTRAX_ROSTER_PATH,
  lineupDetail,
  playerDetail,
} from "@epl/core";
import LineupPlanner from "../../components/league/LineupPlanner";
import SquadBoard from "../../components/league/SquadBoard";
import Sheet from "./Sheet";
import QuerySelect from "../../components/shell/QuerySelect";
import { teamHref } from "../routes";
import TeamShell from "./Shell";
import { rosterMinimums } from "../../rosterMinimums";
import { identify } from "./team";
import { squadView } from "./squadView";
import { commissionerSession } from "./saving";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** Which round's squad. Absent means the round a manager can still change —
   *  next week's, once this week's lineups have locked — which is every arrival
   *  from the table, the matchup card and the squad list. It used to mean the
   *  round Fantrax points at unasked, so mid-Saturday this screen drew a locked
   *  eleven under a running score; the score is Live's job.
   *  The schedule sends a gameweek, so tapping a side in a March fixture opens
   *  March's fifteen rather than this week's — which is the only useful thing
   *  about a fixture in March, and was the one thing that row did not do. */
  searchParams: Promise<{ gw?: string }>;
}) {
  // `teamId` is what the folder is called; `slug` is what the reader typed, and
  // on the front door those are not the same thing. See `squad/routes.ts`.
  const [{ teamId: slug }, { gw }] = await Promise.all([params, searchParams]);
  const { team, mine, planning, open, standing, weeks, benchRanks, eligibility, clubs, opposition, live, news, points, board, pending, squadIds } = await squadView(slug, gw);
  // Fantrax's period selector, on every branch: an earlier week shows its scores, a later one its opponents.
  const picker =
    weeks === null ? null : (
      <QuerySelect
        name="gw"
        label="Gameweek"
        value={String(weeks.shown)}
        options={weeks.options.map((option) => ({ value: String(option.gameweek), label: option.label }))}
        action={teamHref(slug)}
      />
    );

  return (
    /* The only live-points surface that did not move on a Saturday. Both
       arrangements below carry Fantrax's totals and FPL's minutes, and
       `revalidate` bounds staleness without pushing anything to a phone already
       open on the sofa. Same cadence as the head-to-head board that shows the
       same numbers. */
    <TeamShell
      team={identify(team, slug)}
      current="squad"
    >
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
          // **The floor joins the caps here and only here.** Fantrax publishes
          // `maxActive` per position and no minimum on any JSON endpoint, so
          // `mapLeagueInfo` returns an empty one; the commissioner's setup page
          // has the column and `scripts/roster-limits.ts` reads it into a file.
          // The planner is the one screen that enforces a formation, so the two
          // halves meet on the way into it rather than being threaded through
          // every caller of the mapper.
          limits={{ ...planning.roster, minActiveByPosition: rosterMinimums() }}
          // The same week the planner shows, never Fantrax's open one.
          fantraxUrl={`${FANTRAX_LEAGUE_PAGE}${open === null ? "" : `/${FANTRAX_ROSTER_PATH};period=${open.period}`}`}
          pending={pending}
          period={open?.period ?? 0}
          benchRanks={benchRanks}
          canSave={commissionerSession(team.teamId) !== null}
          picker={picker}
        />
      ) : board !== null ? (
        /* The gate. Before his lineups lock a rival's XI is not visible — the
           shape and the active/reserve split are withheld together. The squad
           itself is not: fifteen names, who they play this week, and nothing
           about how they will be arranged.

           Branching on the board rather than on the display again: it exists
           exactly when the gate is closed, so there is no arrangement of the two
           that renders a board with nothing on it. */
        /* The list alone: a pitch would draw the shape the gate withholds, and the season table is the Stats tab's. */
        <div className="flex flex-col gap-2">
          {picker === null ? null : <div className="flex justify-end px-1">{picker}</div>}
          <SquadBoard
            lines={board.lines}
            because={board.because}
            projected={board.projected}
            eligibility={eligibility}
          />
        </div>
      ) : (
        /* An XI nobody may change here: a rival's once his lineups have locked, or
           your own in any week but the open one. Every man on it opens the same
           card the head-to-head board opens, so "why is he on 12" has one answer.

           Arranged here and only here: this is the branch where the lineup is
           public, and building it on the others would be work whose only product
           is a payload nobody may read. The spread is the arrangement itself —
           `rows` and `bench`, which is the whole of what the join returns. */
        <Sheet
          {...lineupDetail(team, clubs, opposition, points)}
          breakdown={live?.breakdown ?? {}}
          news={news}
          pending={pending}
          eligibility={eligibility}
          picker={picker}
          show={standing === "locked" ? "points" : "fixture"}
          // Your own opens on the pitch, as the planner does, so changing week keeps the reading.
          opens={mine ? "pitch" : "list"}
        />
      )}
    </TeamShell>
  );
}
