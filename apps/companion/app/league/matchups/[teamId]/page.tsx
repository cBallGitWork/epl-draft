import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  POLL,
  type LeagueTeam,
  type RosterDisplay,
  clubById,
  duringGameweek,
  headToHead,
  isMatchdayLive,
  lineupDetail,
  oppositionByClub,
  roundFinished,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import AutoRefresh from "../../../components/shell/AutoRefresh";
import MatchupBoard, { type MatchupSide } from "../../../components/league/MatchupBoard";
import Nothing from "../../../components/shell/Nothing";
import TeamSheet from "../../../components/league/TeamSheet";
import LeagueShell from "../../Shell";
import { getLeagueSquads, roundOf, teamDisplay } from "../../../squads";
import { footballNow } from "../../../football";
import { liveScores } from "../../../scoreboard";
import { squadPoints } from "../../../teamStats";
import { myTeamId } from "../../../session";

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

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
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
  const squads = await getLeagueSquads(round);

  // A league nobody has drafted genuinely has no such matchup. The other two are
  // states of ours rather than 404s, and the list page already describes both —
  // so the reader goes there rather than this route growing a second copy of
  // panels that would then drift from the originals.
  if ("undrafted" in squads) notFound();
  if ("unavailable" in squads) redirect("/league/matchups");

  const { period } = squads.period;
  if (squads.info === null || period === null) redirect("/league/matchups");

  // A round in the past shows the eleven Fantrax returns for that period, and
  // whether that is the eleven actually played is unverified until a period has
  // completed (see `fetchTeamRosters`). Said on screen rather than assumed.
  const settled = round !== null && round.gameweek < (await footballNow()).gameweek;

  const rostered = new Map(squads.period.teams.map((team) => [team.teamId, team]));
  const named = rostered.get(teamId);
  if (named === undefined) notFound();

  const pairing = headToHead(squads.info.matchups, squads.info.teams, period, teamId);
  const heading = <>Gameweek {squads.snapshot.gameweek}</>;

  if (pairing === undefined) {
    return (
      <LeagueShell title="Head-to-head" current="matchups" sub={heading}>
        <Nothing title="Nobody this period" code={`period ${period}`}>
          {named.teamName} has no pairing in period {period} — a bye, or a schedule that has not
          reached its first head-to-head. Nothing is being withheld; there is nothing to pair.
        </Nothing>
      </LeagueShell>
    );
  }

  const mine = await myTeamId(squads.period.teams);
  const { scores, refused } = await liveScores(period);
  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  // Two questions, and they had been sharing one answer. `duringGameweek` is the
  // whole window from the first kickoff to the last whistle — right for how often
  // to ask the server, wrong for whether a match is on, which is why the LIVE dot
  // burned through Saturday tea-time with nothing in play.
  const matchday = duringGameweek(squads.snapshot, new Date().toISOString());
  const state = isMatchdayLive(squads.snapshot) ? "live" : roundFinished(squads.snapshot);

  /** Whether a side's eleven is going on screen at all. Asked before the fetch
   *  below, because the answer decides whether that fetch is worth making. */
  const shows = (team: LeagueTeam) =>
    rostered.get(team.teamId) !== undefined &&
    teamDisplay(squads, team.teamId === mine).show === "lineup";

  // What our league scores each player this period, from Fantrax, one read per
  // side. `getTeamRosterInfo` honours `period` — probed 19 Aug — so this is the
  // week on screen rather than whatever week Fantrax is currently pointing at.
  // A refusal costs the numbers and nothing else: the strip falls back to
  // minutes rather than printing noughts nobody earned.
  //
  // Only for a side whose eleven is actually being shown. These numbers are read
  // nowhere else, so a withheld side was fetching a team's whole season to throw
  // it away — and on this page's own main use, "who am I playing this week" read
  // on a Tuesday, exactly one side is withheld. A signed-out reader withholds
  // both, which was two wasted requests per cache window.
  const [yours, theirs] = await Promise.all([
    shows(pairing.team) ? squadPoints(pairing.team.teamId, period) : null,
    shows(pairing.opponent) ? squadPoints(pairing.opponent.teamId, period) : null,
  ]);
  const scored = new Map([
    [pairing.team.teamId, yours],
    [pairing.opponent.teamId, theirs],
  ]);

  const side = (team: LeagueTeam): MatchupSide => {
    const mineHere = team.teamId === mine;
    const roster = rostered.get(team.teamId);
    // Per side, not per page: your own eleven is yours all week and a rival's
    // waits for his period. During football both are open — but this is also the
    // screen for "who am I playing this week", read on a Tuesday, when exactly
    // one of the two is.
    const display = teamDisplay(squads, mineHere);
    const shown = roster !== undefined && display.show === "lineup";
    const season = scored.get(team.teamId) ?? null;

    const withheld = (
      <Withheld team={team} known={roster !== undefined} because={display} period={period} />
    );

    // Both arrangements are joined here, on the server: the join is pure and
    // tested in core, and doing it in the browser would mean shipping every club
    // in the league and every fixture in the round so fifteen players could look
    // two of them up. What crosses is fifteen players' own detail — and the
    // arrangement is legible in it, which is why this branch only builds it once
    // the gate has already opened his eleven.
    const sheet = (mode: "pitch" | "list") => {
      if (!shown) return withheld;
      const points = season?.points ?? null;
      const { rows, bench } = lineupDetail(roster, clubs, opposition, points);
      return (
        <TeamSheet
          rows={rows}
          bench={bench}
          lines={squadDetail(squadUnarranged(roster), clubs, opposition, points)}
          breakdown={season?.breakdown ?? {}}
          projected={season?.projected ?? false}
          mode={mode}
        />
      );
    };

    return {
      team,
      score: scores.get(team.teamId),
      mine: mineHere,
      pitch: sheet("pitch"),
      list: sheet("list"),
    };
  };

  return (
    <LeagueShell title="Head-to-head" current="matchups" sub={heading}>
      <AutoRefresh seconds={matchday ? POLL.live : POLL.idle} />
      {/* Both sibling boards say when the scoreboard is down; this one used to
          render the outage as two silent dashes. */}
      {refused === null ? null : (
        <p className="px-3 text-2xs text-faint">
          Fantrax&apos;s scoreboard is not answering, so there are no totals to show.{" "}
          <span className="numeric">{refused}</span>
        </p>
      )}
      {/* Provenance, and the honest kind: the totals are settled and Fantrax's,
          but whether it hands back the eleven that was actually played or
          today's roster under a past period's number has never been observed —
          no period has completed. Re-ask after 28 Aug and delete this line if
          the answer is history. */}
      {settled ? (
        <p className="px-3 text-2xs text-faint">
          A round already played. The scores are Fantrax&apos;s final ones; the elevens are the
          rosters it returns for that week, which we have not yet been able to prove are the ones
          that were fielded.
        </p>
      ) : null}
      <MatchupBoard team={side(pairing.team)} opponent={side(pairing.opponent)} state={state} />
    </LeagueShell>
  );
}

/** Why a side is not on screen.
 *
 *  Three ways to arrive here and they are not one thing to a reader: Fantrax
 *  sent no roster, a rival's period has not opened, or the gate fell back on a
 *  safety because we could not read the calendar. The last is ours failing and
 *  has the least to say here — the squad page is where it is spelled out. */
function Withheld({
  team,
  known,
  because: display,
  period,
}: {
  team: LeagueTeam;
  /** Whether Fantrax gave us a roster for him at all. */
  known: boolean;
  because: RosterDisplay;
  period: number;
}) {
  const because = !known
    ? `Fantrax sent no roster for ${team.name}.`
    : display.show === "squad" && display.because === "not-started"
      ? `${team.name}'s eleven is not public until period ${period} opens.`
      : `${team.name}'s eleven is not showing.`;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-4 py-10 text-center">
      <p className="max-w-xs text-sm text-muted">{because}</p>
      <Link
        href={`/squad/${team.teamId}`}
        className="flex min-h-11 items-center text-2xs font-bold uppercase tracking-widest text-accent"
      >
        See the squad
      </Link>
    </div>
  );
}
