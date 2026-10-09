import { notFound, redirect } from "next/navigation";
import {
  type LeagueTeam,
  bandCategories,
  clubById,
  roundStarted,
  headToHead,
  nextPairedPeriod,
  openingGameweek,
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
import PhotoGround from "../../../components/football/PhotoGround";
import { venueOf } from "../../../venues";
import { HEAD_TO_HEAD } from "../../../titles";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../../squads";
import { readCalendar, roundOf } from "../../../round";
import { liveScores, squadLivePoints } from "../../../scoreboard";
import { newsFor, readPoolNews } from "../../../poolNews";
import { myTeamId } from "../../../session";
import { MATCHUPS, matchupHref } from "../../routes";
import { wholeNumber } from "../../../wholeNumber";
import { sheetEvents } from "./events";
import { STATS_OF, DEFAULT_SIDE_SORT, matchupTabs, matchupView, statsHref, statsOf } from "./views";
import { boardCategories, boardColumns } from "./sideRows";
import { FootFrame } from "../../../components/shell/FootFrame";
import TabStrip from "../../../components/shell/TabStrip";
import { everyone, subMarks } from "./subs";
import ScoreboardDown from "../../ScoreboardDown";

// One head-to-head: the scoreline and the elevens behind it. The URL's team is the side the board opens on; the side
// Fantrax calls home decides only the ground, its venue.

export const revalidate = 30;

export default async function HeadToHeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** No `gw` is the round Fantrax points at; the schedule sends one, so a played round opens on its own week. */
  searchParams: Promise<{ gw?: string; view?: string; of?: string; sort?: string; dir?: string }>;
}) {
  const [{ teamId }, query] = await Promise.all([params, searchParams]);
  const { gw } = query;
  const view = matchupView(query.view);
  const of = statsOf(query.of);
  const sort = { head: query.sort ?? DEFAULT_SIDE_SORT, descending: query.dir !== "asc" };

  // Through the calendar seam: the period is Fantrax's question, the gameweek FPL's.
  const asked = wholeNumber(gw);
  const round = asked === null ? null : await roundOf(asked);
  const squads = readableOr404(await getLeagueSquads(round), MATCHUPS);

  // Undrafted is a 404; the other two states go to the board, which describes them.
  const period = squads.roundPeriod;
  if (squads.info === null || period === null) redirect(MATCHUPS);

  const state = roundState(squads.snapshot);

  // Whether the round on screen has been played, which decides what Stats says its figures are of. `played`, not
  // `settled`: true at all three finished rungs, and only `data_checked` licenses "final".
  const played = state !== null && state !== "live";

  // A round nobody has kicked off is two squad lists (Craig, 11 Sep 2026). `roundStarted`, not `roundState`, which is
  // null between two Saturday kickoffs too.
  const started = roundStarted(squads.snapshot, squads.snapshot.gameweek);

  const rostered = new Map(squads.period.teams.map((team) => [team.teamId, team]));
  const named = rostered.get(teamId);
  if (named === undefined) notFound();

  const pairing = headToHead(squads.info.matchups, squads.info.teams, period, teamId);
  const heading = <>Gameweek {squads.snapshot.gameweek}</>;

  if (pairing === undefined) {
    // Asked for no round, a team between fixtures opens on its next one: before the first, every tie stood empty.
    const later = round === null ? nextPairedPeriod(squads.info.matchups, squads.info.teams, period, teamId) : undefined;
    const gameweek = later === undefined ? undefined : openingGameweek(await readCalendar(), later);
    if (gameweek !== undefined) redirect(matchupHref(teamId, gameweek, query.view));

    return (
      <LeagueShell current="matchups" title={HEAD_TO_HEAD} sub={heading}>
        <PhotoGround subject={null} />
        <Nothing title="Nobody this gameweek" code={`gameweek ${squads.snapshot.gameweek}`}>
          {named.teamName} has no pairing in gameweek {squads.snapshot.gameweek} — a bye, or a schedule that has not
          reached its first head-to-head. Nothing is being withheld; there is nothing to pair.
        </Nothing>
      </LeagueShell>
    );
  }

  // One cached read of the whole pool's news, narrowed per sheet below; the calendar names a withheld side's lock.
  const [mine, stories, calendar] = await Promise.all([myTeamId(squads.period.teams), readPoolNews(), readCalendar()]);
  const { scores, refused } = await liveScores(period);
  // The league's own names for its categories.
  const categories = squads.info.scoringCategories;
  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  /** Whether a side's eleven goes on screen, asked before the fetch it decides. */
  const shows = (team: LeagueTeam) =>
    rostered.get(team.teamId) !== undefined &&
    teamDisplay(squads, team.teamId === mine).show === "lineup";

  // Each man's points off the scoreboard's own live payload, priced at his slot, so an eleven adds up to its header.
  // Only for a side whose eleven shows: where a man is priced says who is in it.
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

  // Who came on and off, which only the pitch marks.
  const events = view === "lineups" ? await sheetEvents(arranged.values(), squads.snapshot) : new Map();

  // The league's categories either side has a count in, so both boards carry the same columns.
  const printed = boardCategories(categories);
  const columns = boardColumns(printed, arranged.values(), { ...yours?.counts, ...theirs?.counts });
  // Which of each eleven put the points on the board; a gated side arrives as `{}` and names nobody.
  const codes = new Set(Object.values(printed).map((category) => category.code));
  const bands = bandCategories(yours?.counted ?? {}, theirs?.counted ?? {}).filter((band) => codes.has(band.code));

  // Joined on the server, and only once the gate has opened his eleven: what crosses is his men's own detail.
  const side = ({ team, detail, withheld }: SharedSide): MatchupSide => {
    const priced = scored.get(team.teamId) ?? null;
    return {
      team,
      score: scores.get(team.teamId),
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

  const both = sharedSides({ pairing, rostered, shows, arranged, squads, mine, calendar });
  const withheld = withheldNotice(both);
  const gameweek = asked ?? undefined;
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
      <PhotoGround photo={venueOf(pairing.home.teamId)} />
      {refused === null ? null : <ScoreboardDown refused={refused} />}
      {listed === null ? (
        <MatchupBoard
          team={side(both[0])}
          opponent={side(both[1])}
          view={view}
          tabs={matchupTabs(teamId, gameweek)}
          body={
            view === "stats" && of !== "fantasy" ? (
              <SideTab
                side={stat}
                columns={columns}
                counts={(of === "team" ? yours : theirs)?.counts ?? {}}
                breakdown={(of === "team" ? yours : theirs)?.breakdown ?? {}}
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
