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
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** Which gameweek; absent is `squadView`'s choice. The fixture list sends one, so a March fixture opens March's squad. */
  searchParams: Promise<{ gw?: string }>;
}) {
  // `slug` is what the URL says: `me` on the front door (`squad/routes.ts`).
  const [{ teamId: slug }, { gw }] = await Promise.all([params, searchParams]);
  const { team, mine, planning, open, standing, weeks, benchRanks, eligibility, clubs, opposition, live, news, points, board, pending, squadIds, minutes } = await squadView(slug, gw);
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
    <TeamShell
      team={identify(team, slug)}
      current="squad"
    >
      {planning !== null ? (
        <LineupPlanner
          team={team}
          // The whole squad's detail, flat and with points: the planner rearranges it in the browser.
          details={team.players.map((rostered) =>
            playerDetail(rostered, clubs, opposition, points, minutes),
          )}
          // His fifteen's eligibility, not the pool's: this crosses to the browser.
          players={planning.players.filter((p) => squadIds.has(p.fantraxId))}
          // The floors join the caps here: no JSON endpoint publishes a minimum, so `scripts/roster-limits.ts` reads
          // the commissioner's setup page into a file.
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
        /* The gate: before a rival's lineups lock, his fifteen as a list alone; a pitch would draw the shape it withholds. */
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
        /* An eleven nobody may change here: a rival's once locked, or your own in any week but the open one. */
        <Sheet
          {...lineupDetail(team, clubs, opposition, points, minutes)}
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
