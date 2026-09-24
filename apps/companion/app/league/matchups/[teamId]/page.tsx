import { notFound, redirect } from "next/navigation";
import {
  type LeagueTeam,
  bandCategories,
  clubById,
  roundStarted,
  headToHead,
  oppositionByClub,
  roundState,
  wasFielded,
} from "@epl/core";
import MatchupBoard, { type MatchupSide } from "../../../components/league/MatchupBoard";
import Nothing from "../../../components/shell/Nothing";
import TeamSheet from "../../../components/league/TeamSheet";
import { SquadLists, arrangeBoth, unplayedLists } from "./sides";
import { SideTab, StatsTab, sharedSides, withheldNotice, type SharedSide } from "./tabs";
import { FixturesTab, TableTab } from "./wider";
import LeagueShell from "../../Shell";
import { HEAD_TO_HEAD } from "../../../titles";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../../squads";
import { roundOf } from "../../../round";
import { liveScores, squadLivePoints } from "../../../scoreboard";
import { newsFor, readPoolNews } from "../../../poolNews";
import { teamBadges } from "../../../standings";
import { myTeamId } from "../../../session";
import { MATCHUPS } from "../../routes";
import { sheetEvents } from "./events";
import { STATS_OF, DEFAULT_SIDE_SORT, matchupTabs, matchupView, statsHref, statsOf } from "./views";
import { boardColumns } from "./sideRows";
import { FootFrame } from "../../../components/shell/FootFrame";
import TabStrip from "../../../components/shell/TabStrip";
import { everyone, subMarks } from "./subs";

// One head-to-head, at the size it deserves on a Saturday.
//
// The hole this fills was named in `docs/ui/matchday.md`: the live view could
// say a manager was on 47 points and could show him Arsenal against Coventry,
// and never once said which of his own players had done it. The score was a
// number with no players behind it.
//
// The team in the URL is the side the board opens on, so tapping a name
// anywhere in the app arrives on that name's eleven. Which side Fantrax calls
// home is not used for anything: there is no ground.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function HeadToHeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** Which round. Absent means the one Fantrax is currently pointing at, which
   *  is every arrival from the live board; the schedule sends a gameweek so a
   *  round that has been played opens on its own week rather than on this one. */
  searchParams: Promise<{ gw?: string; view?: string; of?: string; sort?: string; dir?: string }>;
}) {
  const [{ teamId }, query] = await Promise.all([params, searchParams]);
  const { gw } = query;
  const view = matchupView(query.view);
  const of = statsOf(query.of);
  const sort = { head: query.sort ?? DEFAULT_SIDE_SORT, descending: query.dir !== "asc" };

  // Resolved through the calendar seam rather than assumed equal: the period is
  // what Fantrax is asked for and the gameweek is what FPL is asked for, and
  // nothing here may take one for the other.
  const asked = Number(gw);
  const round = Number.isInteger(asked) ? await roundOf(asked) : null;
  const squads = readableOr404(await getLeagueSquads(round), MATCHUPS);

  // A league nobody has drafted genuinely has no such matchup. The other two are
  // states of ours rather than 404s, and the list page already describes both —
  // so the reader goes there rather than this route growing a second copy of
  // panels that would then drift from the originals.

  const period = squads.roundPeriod;
  if (squads.info === null || period === null) redirect(MATCHUPS);

  const state = roundState(squads.snapshot);

  // Whether the round on screen has been played, which decides what the Stats
  // board says its figures are OF. `wasFielded` below tells the two apart: the
  // arrangement Fantrax stored for the period, or today's squad standing in for
  // it — two different claims, so two sentences and not one hedged one.
  //
  // Asked of the round on screen, never of whether the URL carried a gameweek:
  // arriving from the live board leaves `round` null, and a finished round is no
  // less finished for having been reached without a query string.
  // `played`, not `settled`. It is true at all three finished rungs, and only
  // the top one — `data_checked` — licenses the word "final".
  const played = state !== null && state !== "live";

  // A round nobody has kicked off is two squad lists and nothing else (Craig, 11 Sep 2026): every tab is empty.
  //
  // `roundStarted` and not `roundState`, and the distinction is load-bearing:
  // that one answers null both before the first kickoff AND between two Saturday
  // kickoffs, and tea-time is not "not played".
  const started = roundStarted(squads.snapshot, squads.snapshot.gameweek);

  const rostered = new Map(squads.period.teams.map((team) => [team.teamId, team]));
  const named = rostered.get(teamId);
  if (named === undefined) notFound();

  const pairing = headToHead(squads.info.matchups, squads.info.teams, period, teamId);
  const heading = <>Gameweek {squads.snapshot.gameweek}</>;

  if (pairing === undefined) {
    return (
      <LeagueShell current="matchups" title={HEAD_TO_HEAD} sub={heading}>
        <Nothing title="Nobody this gameweek" code={`gameweek ${period}`}>
          {named.teamName} has no pairing in gameweek {period} — a bye, or a schedule that has not
          reached its first head-to-head. Nothing is being withheld; there is nothing to pair.
        </Nothing>
      </LeagueShell>
    );
  }

  // One cached read of the whole pool's news, narrowed per sheet below.
  const [mine, badges, stories] = await Promise.all([
    myTeamId(squads.period.teams),
    teamBadges(),
    readPoolNews(),
  ]);
  const { scores, refused } = await liveScores(period);
  // What this league calls each scoring category. Its own vocabulary, off its
  // own payload — the two leagues do not share one.
  const categories = squads.info.scoringCategories;
  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  /** Whether a side's eleven is going on screen at all. Asked before the fetch
   *  below, because the answer decides whether that fetch is worth making. */
  const shows = (team: LeagueTeam) =>
    rostered.get(team.teamId) !== undefined &&
    teamDisplay(squads, team.teamId === mine).show === "lineup";

  // What our league scores each player this period, from the same live payload
  // the scoreboard above is read from — so the eleven adds up to the header over
  // it. `getTeamRosterInfo` cannot do that twice over: its `period` is inert for
  // points, so it answered a season total under a card headed "This period", and
  // it prices a man at his default position rather than at the slot his manager
  // filed him in. Both were invisible while the season was one gameweek old.
  //
  // Costs no request at all now — one `getLiveScoringStats` already fetched for
  // the scoreboard, mapped a second time — where this used to be one
  // `getTeamRosterInfo` per side. Only asked for a side whose eleven is on
  // screen, because which section a man is priced in says who is in the eleven.
  const [yours, theirs] = await Promise.all([
    shows(pairing.team) ? squadLivePoints(period, pairing.team.teamId, categories) : null,
    shows(pairing.opponent) ? squadLivePoints(period, pairing.opponent.teamId, categories) : null,
  ]);
  const scored = new Map([
    [pairing.team.teamId, yours],
    [pairing.opponent.teamId, theirs],
  ]);

  const { arranged, widest } = arrangeBoth({ pairing, rostered, shows, scored, clubs, opposition });
  const listed = started ? null : unplayedLists({ pairing, rostered, clubs, opposition });

  const boards = view === "lineups" || (view === "stats" && of !== "fantasy");
  const events = boards ? await sheetEvents(arranged.values(), squads.snapshot) : new Map();

  // The league's categories either side has a count in, so both boards carry the same columns.
  const columns = boardColumns(categories, arranged.values(), { ...yours?.counts, ...theirs?.counts });
  // Which of each eleven put the points on the board; a gated side arrives as `{}` and names nobody.
  const bands = bandCategories(yours?.counted ?? {}, theirs?.counted ?? {});

  // Joined on the server, and only once the gate has opened his eleven: what crosses is his men's own detail.
  const side = ({ team, detail, withheld }: SharedSide): MatchupSide => {
    const priced = scored.get(team.teamId) ?? null;
    return {
      team,
      score: scores.get(team.teamId),
      badge: badges.get(team.teamId),
      mine: team.teamId === mine,
      lineup:
        detail === undefined ? (
          withheld
        ) : (
          <TeamSheet
            rows={detail.rows}
            bench={detail.bench}
            widest={widest}
            subs={subMarks(everyone(detail), events)}
            breakdown={priced?.breakdown ?? {}}
            // This sheet's men only — a story is keyed by player, and would name a withheld eleven.
            news={newsFor(
              stories,
              everyone(detail).map((player) => player.rostered.slot.fantraxId),
            )}
            mode="pitch"
          />
        ),
    };
  };

  const both = sharedSides({ pairing, rostered, shows, arranged, squads, mine });
  const withheld = withheldNotice(both);
  const gameweek = Number.isInteger(asked) ? asked : undefined;
  const stat = both[of === "opponent" ? 1 : 0];

  return (
    // A match screen: the scoreline is its header, and its strip picks one of its own views.
    <FootFrame
      foot={
        view === "stats" && listed === null ? (
          <TabStrip
            label="Stats views"
            current={of}
            tabs={STATS_OF.map((key) => ({
              key,
              label: key === "fantasy" ? "Fantasy" : both[key === "team" ? 0 : 1].team.name,
              href: statsHref(teamId, gameweek, key),
            }))}
          />
        ) : undefined
      }
    >
      {/* Both sibling boards say when the scoreboard is down; this one used to
          render the outage as two silent dashes. */}
      {refused === null ? null : (
        <p className="px-3 text-2xs text-faint">
          Fantrax&apos;s scoreboard is not answering, so there are no totals to show.{" "}
          <span className="numeric">{refused}</span>
        </p>
      )}
      {listed === null ? (
        <MatchupBoard
          team={side(both[0])}
          opponent={side(both[1])}
          view={view}
          tabs={matchupTabs(teamId, gameweek)}
          body={
            view === "stats" && of !== "fantasy" && stat !== undefined ? (
              <SideTab
                side={stat}
                columns={columns}
                counts={(of === "team" ? yours : theirs)?.counts ?? {}}
                subs={stat.detail === undefined ? {} : subMarks(everyone(stat.detail), events)}
                sort={sort}
                hrefFor={(head: string) =>
                  statsHref(teamId, gameweek, of, { head, descending: head === sort.head ? !sort.descending : true })
                }
              />
            ) : view === "stats" ? (
              <StatsTab
                bands={bands}
                names={both[0].names}
                theirNames={both[1].names}
                withheld={withheld}
                played={played}
                fielded={wasFielded(squads.period, period)}
              />
            ) : view === "table" ? (
              <TableTab tie={[pairing.team.teamId, pairing.opponent.teamId]} mine={mine} />
            ) : view === "fixtures" ? (
              <FixturesTab
                fixtures={squads.snapshot.fixtures}
                sides={both}
                snapshotClubs={squads.snapshot.clubs}
                withheld={withheld}
              />
            ) : null
          }
        />
      ) : (
        <SquadLists team={pairing.team} opponent={pairing.opponent} lists={listed} />
      )}
    </FootFrame>
  );
}
