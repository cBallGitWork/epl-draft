import { notFound } from "next/navigation";
import {
  clubById,
  oppositionByClub,
  playerName,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../squads";
import { lastLockedRound, leagueInfo, planningRound, roundOf } from "../../round";
import { newsFor, readPoolNews } from "../../poolNews";
import { pendingByTeam, squadLivePoints } from "../../scoreboard";
import { squadSeason } from "../../teamStats";
import { myTeamId } from "../../session";
import { OWN, SQUAD } from "../routes";
import { whoseTeam } from "./team";

// One manager's squad, laid out on a pitch. The screen the league opens on a
// Saturday, and the reason the join exists.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)

// Everything a team's squad page shows, read and joined: which round, whose team, what the reader
// may see of it, and the points, news and season beside it. The page draws it.

export async function squadView(slug: string, gw: string | undefined) {

  // Through the calendar seam, never by taking one number for the other: the
  // period is what Fantrax is asked for and the gameweek is what FPL is asked
  // for. Same resolution the head-to-head route makes.
  const asked = Number(gw);
  // **Which week this screen is about, and it is not the same question for every
  // team** (Craig, 2 Sep, more than once: tapping a squad from the league should
  // land on a pitch).
  //
  // Your own squad is about the week you can still CHANGE — that is what a
  // planner is — so it takes the planning round. Everybody else's is about an
  // arrangement, and the planning week is precisely the one the gate withholds:
  // pointing a rival's screen there meant the eleven was never visible from an
  // ordinary tap, all week, every week. The last LOCKED week is the most recent
  // one that has an arrangement to show, and on a Saturday it is the live one.
  //
  // `?gw=` still wins over both: a reader who named a week gets that week.
  //
  // Resolved from the league's own team list rather than from the roster read
  // this decides, which would be circular: `leagueInfo` names every team and is
  // separately cached, so asking it costs nothing a squad screen was not already
  // paying.
  // Named apart from `mine` below, which is the authority: that one validates
  // against the ROSTERED teams and is what every gate and label reads. This is
  // the same question asked early enough to choose a week, off the league's own
  // list, and the two can only disagree for a team that exists in the league and
  // holds no roster — which has no squad screen to show either way.
  const info = await leagueInfo();
  // The front door asks for its own team by name, so it needs no id to compare:
  // `/squad/me` is by definition the week its reader can still change.
  const asksOwn =
    slug === OWN || (info !== null && (await myTeamId(info.teams)) === slug);

  const round = Number.isInteger(asked)
    ? await roundOf(asked)
    : asksOwn
      ? await planningRound()
      : await lastLockedRound();
  const squads = readableOr404(await getLeagueSquads(round), SQUAD);

  // Whose squad this is. Most visits to this route are to somebody else's — the
  // matchup card and the squad list both lead here — and the two readings want
  // different things said, so the page knows which it is serving.
  //
  // It is also what the front door resolves to: a reader who is not signed in
  // has no own team, and the index is where the code goes in.
  const { teamId, mine } = await whoseTeam(slug, squads.period.teams);

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

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

  // What each of them is ELIGIBLE at, which is not the slot his manager filed
  // him in. Fantrax publishes both and they disagree for 48 of 607 — Saka is
  // `F,M` and is filed at M — so the list's position column reads this and the
  // scoring reads the slot. Fifteen entries, not the pool's 697: this crosses to
  // the browser and the other 682 are not this manager's business.
  //
  // A record rather than a `Map` because of that crossing: the boundary
  // serialises through JSON and a `Map` arrives as `{}` with no `.get`.
  const eligibility: Record<string, string[]> = {};
  for (const state of squads.info?.players ?? []) {
    if (squadIds.has(state.fantraxId)) eligibility[state.fantraxId] = state.eligiblePositions;
  }

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
  // Whether the sheet below is the branch that renders, asked before the fetch
  // because the answer decides whether the news read is worth making.
  const sheet = planning === null && display.show === "lineup";
  // Concurrent, not serial: this screen is read on a matchday.
  const [live, stories] = await Promise.all([
    priced === null ? null : squadLivePoints(priced.period, teamId, priced.categories),
    sheet ? readPoolNews() : null,
  ]);
  // Fifteen men's news, not the pool's 74 — this crosses to the browser.
  const news = stories === null ? undefined : newsFor(stories, [...squadIds]);
  // Tied to the branch that LABELS it a season total, not to the absence of the
  // live one. `priced` also needs `squads.info`, so with `getLeagueInfo` refused
  // — a modelled, separately-cached state — an own-team lineup fell through to
  // the season table and `Sheet` rendered it under a card headed "This period",
  // at a man's default position rather than his roster slot. This is the same
  // condition `board` is built on, so the two cannot disagree.
  // **The planner needs it too, and for the opposite reason.** The gated branch
  // reads the season because it may not read the round; this one reads the round
  // and the round has not been played — the planner opens on the week a manager
  // can still CHANGE, so before Saturday every live figure is a dash and a column
  // headed `FPts` reads as broken data rather than as an empty week.
  const season = display.show === "squad" || planning !== null ? await squadSeason(teamId) : null;
  // Whether this period has actually scored anything yet, which is not the same
  // as whether Fantrax answered: it returns a row per player with a null against
  // each until the first whistle. Asked of the numbers rather than of the clock,
  // so the column turns over the moment the football starts and needs no second
  // source of truth about when a round begins.
  const scored =
    live !== null && [...live.points.values()].some((figure) => figure !== null);
  const points = (scored ? live?.points : (season?.points ?? live?.points)) ?? null;
  const board =
    display.show === "squad"
      ? {
          because: display.because,
          projected: season?.stats.season.projected ?? false,
          lines: squadDetail(squadUnarranged(team), clubs, opposition, points),
        }
      : null;
  // Fantrax's stat rows carry an id and no name, deliberately: the squad already
  // names every one of them and a second copy is the one that disagrees when a
  // commissioner renames somebody.
  const names = new Map(team.players.map((rostered) => [rostered.slot.fantraxId, playerName(rostered)]));

  // The one number Fantrax's live feed withholds: a clean sheet is not credited
  // until the final whistle, so a squad's visible total understates it for the
  // last half-hour of every match. Two screens already say it — the Live tab's
  // own tie and the head-to-head board — and this is the third, which is the
  // screen a manager is actually on when he wonders why his defenders are worth
  // nothing.
  //
  // **`display` and not `squads.display`**, and the distinction is the gate's.
  // Only ACTIVE players are owed one, so a `+8` beside a squad says a defender is
  // in the eleven — exactly the fact the gate withholds before a deadline.
  // `pendingByTeam` refuses on anything but `show === "lineup"`, and the value
  // handed to it here is THIS team's own answer: your XI is yours all week, a
  // rival's waits for his period to open.
  //
  // Nought is not a preview. A squad owed nothing prints nothing rather than a
  // `+0`, which would read as a claim that the clean sheets have been counted.
  const owed = pendingByTeam([team], squads.info?.scoring ?? null, squads.snapshot, display).get(
    teamId,
  )?.points;
  const pending = owed ? owed : null;

  return { team, planning, eligibility, clubs, opposition, live, news, season, scored, points, board, names, pending, squadIds };
}
