import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  type LeagueTeam,
  type RosterDisplay,
  clubById,
  headToHead,
  lineupDetail,
  oppositionByClub,
  roundState,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import AutoRefresh from "../../../components/shell/AutoRefresh";
import MatchupBoard, { type MatchupSide } from "../../../components/league/MatchupBoard";
import Nothing from "../../../components/shell/Nothing";
import TeamSheet from "../../../components/league/TeamSheet";
import LeagueShell from "../../Shell";
import { getLeagueSquads, roundOf, teamDisplay } from "../../../squads";
import { pollSeconds } from "../../../football";
import { liveScores, squadLivePoints } from "../../../scoreboard";
import { teamBadges } from "../../../badges";
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

  const period = squads.roundPeriod;
  if (squads.info === null || period === null) redirect("/league/matchups");

  const state = roundState(squads.snapshot);

  // A round in the past shows TODAY'S squad, not the eleven that played it.
  // Fantrax does keep the period's own copy — that was settled on 28 Aug — but
  // `squads.ts` deliberately does not ask for it, and the note there says why.
  // Said on screen rather than assumed away: a reader knows which of his men he
  // only signed this morning, and a page that quietly puts him in last week's
  // eleven teaches him to distrust the weeks it has right.
  //
  // Asked of the round on screen, never of whether the URL carried a gameweek:
  // arriving from the live board leaves `round` null, and a finished round is no
  // less finished for having been reached without a query string.
  // `played`, not `settled`. It is true at all three finished rungs, and only
  // the top one — `data_checked` — licenses the word "final". `RoundWord` on this
  // same screen withholds it until then, so a boolean called `settled` printing
  // "final" beside it was two contradictory promises in one render.
  const played = state !== null && state !== "live";

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

  const [mine, badges] = await Promise.all([myTeamId(squads.period.teams), teamBadges()]);
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
      const points = priced?.points ?? null;
      const { rows, bench } = lineupDetail(roster, clubs, opposition, points);
      return (
        <TeamSheet
          rows={rows}
          bench={bench}
          lines={squadDetail(squadUnarranged(roster), clubs, opposition, points)}
          breakdown={priced?.breakdown ?? {}}
          mode={mode}
        />
      );
    };

    return {
      team,
      score: scores.get(team.teamId),
      badge: badges.get(team.teamId),
      mine: mineHere,
      pitch: sheet("pitch"),
      list: sheet("list"),
    };
  };

  return (
    <LeagueShell title="Head-to-head" current="matchups" sub={heading}>
      <AutoRefresh seconds={pollSeconds(squads.snapshot)} />
      {/* Both sibling boards say when the scoreboard is down; this one used to
          render the outage as two silent dashes. */}
      {refused === null ? null : (
        <p className="px-3 text-2xs text-faint">
          Fantrax&apos;s scoreboard is not answering, so there are no totals to show.{" "}
          <span className="numeric">{refused}</span>
        </p>
      )}
      {/* Provenance, and the honest kind: the totals are Fantrax's own, and the
          elevens are whatever its roster read returns — the arrangement it
          currently considers open, not the one that was fielded. That is now a
          statement of what we do rather than of what we could not find out. The
          scores are deliberately not called final: `state` is true here at all
          three finished rungs and only `data_checked` earns that word, which is
          the distinction `RoundWord` beside this makes. */}
      {played ? (
        <p className="px-3 text-2xs text-faint">
          A round already played. The scores are Fantrax&apos;s own; the elevens are today&apos;s
          squads rather than the ones that were fielded. Fantrax keeps the old ones and we are not
          reading them yet.
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
    : display.show === "squad" && display.because === "not-locked"
      ? `${team.name}'s eleven is not public until lineups lock for period ${period}.`
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
