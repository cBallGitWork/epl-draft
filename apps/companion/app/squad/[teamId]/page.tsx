import {
  FANTRAX_LEAGUE_PAGE,
  FANTRAX_ROSTER_PATH,
  lineupDetail,
  playerDetail,
} from "@epl/core";
import LineupPlanner from "../../components/league/LineupPlanner";
import SeasonGrid from "../../components/league/SeasonGrid";
import SquadBoard from "../../components/league/SquadBoard";
import Sheet from "./Sheet";
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
  const { team, planning, open, benchRanks, eligibility, clubs, opposition, live, news, season, points, board, names, pending, squadIds } = await squadView(slug, gw);

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
        />
      ) : board !== null ? (
        /* The gate. Before his lineups lock a rival's XI is not visible — the
           shape and the active/reserve split are withheld together. The squad
           itself is not: fifteen names, who they play this week, and nothing
           about how they will be arranged.

           Branching on the board rather than on the display again: it exists
           exactly when the gate is closed, so there is no arrangement of the two
           that renders a board with nothing on it. */
        /* Two panels, and above `lg` they stand beside each other. That is not a
           preference: Championship Manager's own content area is 710px of an
           800px canvas, and a 1440 screen less the rail is 1310 — so one panel
           up here is not a CM screen scaled up, it is a CM screen with half of
           it missing. Split in two, each panel is about the width the whole game
           had. Below `lg` they stack, and never the other way round: a band
           above the pitch comes out of the pitch's own screen budget.
           `items-start` so the shorter panel does not stretch to the taller
           one's height, and **`minmax(0,1fr)` on the single column below `lg` as
           well as on the pair above it**: a grid item's default `min-width: auto`
           is its content's min-content width, so the season grid's seventeen
           columns widened the whole page rather than scrolling inside their own
           panel — a 390 phone laid out at 627. The `overflow-x-auto` around the
           table cannot help while the column it sits in is free to grow. */
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <SquadBoard
            lines={board.lines}
            because={board.because}
            projected={board.projected}
            eligibility={eligibility}
          />
          {/* The second panel, and it costs one cache hit. `squadSeason` already
              reads this table to price the board; what it used to drop on the
              floor is thirteen scoring columns, a per-game figure and Fantrax's
              own name for the season. */}
          {season !== null ? <SeasonGrid stats={season.stats} names={names} /> : null}
        </div>
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
          breakdown={live?.breakdown ?? {}}
          news={news}
          pending={pending}
          eligibility={eligibility}
        />
      )}
    </TeamShell>
  );
}
