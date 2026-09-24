import { notFound, redirect } from "next/navigation";
import {
  type LeagueTeam,
  bandCategories,
  clubById,
  compareCategories,
  roundStarted,
  headToHead,
  oppositionByClub,
  roundState,
  wasFielded,
  DASH,
} from "@epl/core";
import MatchupBoard, { type MatchupSide } from "../../../components/league/MatchupBoard";
import Nothing from "../../../components/shell/Nothing";
import TeamSheet from "../../../components/league/TeamSheet";
import { SquadLists, Withheld, arrangeBoth, unplayedLists } from "./sides";
import { PlayersTab, StatsTab, sharedSides, withheldNotice } from "./tabs";
import { ScoresTab, TableTab } from "./wider";
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
  searchParams: Promise<{ gw?: string }>;
}) {
  const [{ teamId }, { gw }] = await Promise.all([params, searchParams]);

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

  // **A round nobody has kicked off is two squad lists and nothing else**
  // (Craig, 11 Sep 2026: *"for a match that has not been played, just show the
  // two squad lists, thats it"*). Every one of the four tabs is furniture before
  // the football: the scoreline is 0–0, the grass is a withheld panel because the
  // lineups have not locked, and Stats, Players and Report are all boards of
  // dashes. A strip whose every plate leads to an empty box is four controls
  // saying the same nothing.
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
  // screen, because these keys are the eleven.
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

  const events = await sheetEvents(arranged.values(), squads.snapshot);

  // Every category either squad registered, in one order, computed ONCE.
  //
  // It is the compare board's rows and both stat boards' columns, which is the
  // same list seen twice — so a category his keeper has and yours does not is a
  // column on both sides rather than a board that reshuffles when you tap the
  // other half. The union is why this is a join in core and not two independent
  // reads: a row missing from one side would print as a nought, and a nought is a
  // claim the payload did not make.
  const columns = compareCategories(yours?.breakdown ?? {}, theirs?.breakdown ?? {});
  // The same union with its workings — which of his eleven put the 9 on the
  // board. Derived from `columns` in core, so the two boards cannot disagree
  // about which categories exist or in what order. Fed the SAME two
  // conditionally-fetched breakdowns: a gated side arrives as `{}` and
  // contributes no band and no name, which is the whole of the gate here.
  const bands = bandCategories(yours?.breakdown ?? {}, theirs?.breakdown ?? {});

  const side = (team: LeagueTeam): MatchupSide => {
    const mineHere = team.teamId === mine;
    const roster = rostered.get(team.teamId);
    // Per side, not per page: your own eleven is yours all week and a rival's
    // waits for his period. During football both are open — but this is also the
    // screen for "who am I playing this week", read on a Tuesday, when exactly
    // one of the two is.
    const display = teamDisplay(squads, mineHere);
    const shown = roster !== undefined && display.show === "lineup";
    const priced = scored.get(team.teamId) ?? null;

    const withheld = (
      <Withheld team={team} known={roster !== undefined} because={display} />
    );

    // Both arrangements are joined here, on the server: the join is pure and
    // tested in core, and doing it in the browser would mean shipping every club
    // in the league and every fixture in the round so fifteen players could look
    // two of them up. What crosses is fifteen players' own detail — and the
    // arrangement is legible in it, which is why this branch only builds it once
    // the gate has already opened his eleven.
    const detail = shown && roster !== undefined ? arranged.get(team.teamId) : undefined;
    return {
      team,
      score: scores.get(team.teamId),
      badge: badges.get(team.teamId),
      mine: mineHere,
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
              [...detail.rows.flatMap((line) => line.players), ...detail.bench].map(
                (player) => player.rostered.slot.fantraxId,
              ),
            )}
            mode="pitch"
          />
        ),
    };
  };

  const both = sharedSides({ pairing, rostered, shows, arranged, scored, squads, mine });
  const withheld = withheldNotice(both);

  return (
    // **A MATCH screen, not a league section wearing one** (Craig, 5 Sep 2026:
    // "remove Tim Hortons Pro League here… remove Head-to-head row… match score
    // row should be at top").
    //
    // `LeagueShell` gives every League view a competition title bar, a tab strip
    // and a yellow caption, which is right for a table and wrong here: a match
    // belongs to neither side and to no section, and `prem/match/[id]` already
    // makes that argument for the real thing — its `MatchBar` IS its header. Two
    // objects came off the top of this page and 114px of a 844px phone came with
    // them, which is the difference between the eleven and the bench being one
    // view and being one and a bit.
    //
    // **The tab strip is the match's own, and it came back** (Craig, 11 Sep
    // 2026: "and need the blue bars"). What came off on 5 Sep was the SECTION
    // strip — five plates that all leave the match, above the score — and that
    // stays off: League is one plate away at every width now the phone's
    // navigation is a foot row. What is here instead is the object DESIGN §2
    // actually names, a strip picking one of a subject's views, and by 11 Sep it
    // was choosing between four of them rather than two.
    <div className="flex flex-col gap-2">
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
          team={side(pairing.team)}
          opponent={side(pairing.opponent)}
          stats={
            <StatsTab
              bands={bands}
              managers={{ mine: pairing.team.name, theirs: pairing.opponent.name }}
              names={both[0]?.names ?? new Map()}
              theirNames={both[1]?.names ?? new Map()}
              withheld={withheld}
              played={played}
              fielded={wasFielded(squads.period, period)}
            />
          }
          players={
            <PlayersTab
              sides={both.map((one: (typeof both)[number]) => ({
                team: one.team,
                detail: one.detail,
                columns,
                breakdown: one.breakdown,
                withheld: one.withheld,
              }))}
            />
          }
          table={<TableTab tie={[pairing.team.teamId, pairing.opponent.teamId]} mine={mine} />}
          scores={
            <ScoresTab
              fixtures={squads.snapshot.fixtures}
              sides={both}
              clubName={(id) => clubs.get(id)?.shortName ?? DASH}
            />
          }
        />
      ) : (
        <SquadLists team={pairing.team} opponent={pairing.opponent} lists={listed} />
      )}
    </div>
  );
}
