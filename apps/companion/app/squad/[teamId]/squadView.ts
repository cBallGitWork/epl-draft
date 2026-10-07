import {
  FANTRAX_LEAGUE_ID,
  clubById,
  fetchLineupState,
  mapLineupState,
  oppositionByClub,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../squads";
import { lastLockedRound, leagueInfo, planningRound, readCalendar, roundOf } from "../../round";
import { newsFor, readPoolNews } from "../../poolNews";
import { pendingByTeam, squadLivePoints } from "../../scoreboard";
import { leagueScoring } from "../../scoring";
import { squadSeason } from "../../teamStats";
import { myTeamId } from "../../session";
import { OWN, SQUAD } from "../routes";
import { plannable } from "./plannable";
import { gameweekPicker, weekStanding } from "./weeks";
import { whoseTeam } from "./team";
import { minutesFrom } from "../../xmins";

// Everything a team's squad page shows, read and joined: which round, whose team, what the reader
// may see of it, and the points, news and season beside it. The page draws it.

export async function squadView(slug: string, gw: string | undefined) {
  // Through the calendar seam: the period is Fantrax's question, the gameweek FPL's.
  const asked = Number(gw);
  // Your own squad is about the week you can still change; a rival's about the last locked one, the latest with an
  // arrangement to show (Craig, 2 Sep 2026); `?gw=` beats both. Asked off the league's own list: `mine` below is the
  // authority, but the roster read cannot choose its own week.
  const info = await leagueInfo();
  const asksOwn =
    slug === OWN || (info !== null && (await myTeamId(info.teams)) === slug);

  const [open, calendar] = await Promise.all([planningRound(), readCalendar()]);
  const round = Number.isInteger(asked) ? await roundOf(asked) : asksOwn ? open : await lastLockedRound();
  // A week ahead of the open one has no score yet; Fantrax answers it with noughts, which are not a reading.
  const standing = weekStanding(round, open);
  const weeks = gameweekPicker(calendar, round);
  const squads = readableOr404(await getLeagueSquads(round), SQUAD);

  const { team, mine } = await whoseTeam(slug, squads.period.teams);
  const teamId = team.teamId;

  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  // What this reader may see of this team: your own lineup all week, a rival's once his period opens.
  const display = teamDisplay(squads, mine);

  // The rules the planner enforces, or null: a rival's squad, any week but the open one, or no rules from Fantrax.
  const planning =
    mine && plannable(round, open) && display.show === "lineup" && squads.info !== null ? squads.info : null;
  const squadIds = new Set(team.players.map((p) => p.slot.fantraxId));
  const benchRanks = planning === null || open === null ? {} : await benchOrderOf(teamId, open.period);

  // What each is eligible at, not his filed slot (they differ for 48 of 607): fifteen entries, as a record, since it
  // crosses to the browser.
  const eligibility: Record<string, string[]> = {};
  for (const state of squads.info?.players ?? []) {
    if (squadIds.has(state.fantraxId)) eligibility[state.fantraxId] = state.eligiblePositions;
  }

  // Gate open: points off the live scoreboard, priced at each man's slot for this period. Gate closed: the season
  // table, which names all fifteen and nothing of their arrangement.
  const priced =
    display.show === "lineup" && standing !== "ahead" && squads.roundPeriod !== null && squads.info !== null
      ? { period: squads.roundPeriod, categories: squads.info.scoringCategories }
      : null;
  // Whether the sheet is the branch that renders, which decides whether the news read is worth making.
  const sheet = planning === null && display.show === "lineup";
  // Concurrent, not serial: this screen is read on a matchday. Only the sheet reads the round.
  const [live, stories, scoring] = await Promise.all([
    priced === null || !sheet ? null : squadLivePoints(priced.period, teamId, priced.categories),
    sheet ? readPoolNews() : null,
    leagueScoring(),
  ]);
  // xMins from the week on screen, so a future week's list reads that week's minutes.
  const minutes = minutesFrom(round?.gameweek ?? null);
  // Fifteen men's news, not the pool's 74 — this crosses to the browser.
  const news = stories === null ? undefined : newsFor(stories, [...squadIds]);
  // The season table for the branch that labels it a season, and for the planner (Craig, 30 Sep 2026).
  const season = display.show === "squad" || planning !== null ? await squadSeason(teamId) : null;
  // Whether this period has scored yet, asked of the numbers: Fantrax sends a null per man until the first whistle.
  const scored =
    live !== null && [...live.points.values()].some((figure) => figure !== null);
  const points = (scored ? live?.points : (season?.points ?? live?.points)) ?? null;
  const board =
    display.show === "squad"
      ? {
          because: display.because,
          projected: season?.stats.season.projected ?? false,
          lines: squadDetail(squadUnarranged(team), clubs, opposition, points, minutes),
        }
      : null;

  // Clean sheets Fantrax credits at full time, judged on this team's own `display`: a +8 says a defender is in the
  // eleven, which the gate withholds. Nought prints nothing.
  const owed = pendingByTeam([team], scoring?.rules ?? null, squads.snapshot, display).get(
    teamId,
  )?.points;
  const pending = owed ? owed : null;

  return { team, mine, planning, open, standing, weeks, benchRanks, eligibility, clubs, opposition, live, news, points, board, pending, squadIds, minutes };
}

/** Fantrax's bench order for the planned week, `scorerId → rank`; none when the read fails or names another week. */
async function benchOrderOf(teamId: string, period: number): Promise<Record<string, number>> {
  try {
    const state = mapLineupState(await fetchLineupState(FANTRAX_LEAGUE_ID, teamId, period));
    return state?.period === period ? { ...state.autoSubOrder } : {};
  } catch {
    return {};
  }
}
