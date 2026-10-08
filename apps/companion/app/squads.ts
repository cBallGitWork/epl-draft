import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type Bridge,
  type FootballSnapshot,
  type GameweekKickoff,
  type LeagueInfo,
  type RosterDisplay,
  type RosteredPeriod,
  type RawTeamRosters,
  fetchTeamRosters,
  mapTeamRosters,
  periodToRead,
  resolveRosters,
  rosterDisplay,
} from "@epl/core";
import { leagueInfo, roundOf, type Round } from "./round";
import { now } from "./clock";
import { leagueCache } from "./leagueCache";
import { footballNow, gameweekSnapshot, seasonKickoffs } from "./football";
import { myTeamId } from "./session";
import { shortTeamNames } from "./teamNames";
import { orRefusal, tell } from "./refusals";
import type { Unavailable } from "./refusals";
import mapping from "../../../data/mappings/fantrax.json";
import { notFound, redirect } from "next/navigation";

// Where the app supplies the bridge: core cannot read `data/mappings/`, which keeps the audited mapping at the edge.
// A JSON import widens `matchedBy` to string; asserted once, here, and exported so it stays once.
export const bridge = mapping as Bridge;

/** Everything a squad view needs. */
export interface ReadableSquads {
  /** The season's kickoffs, for the gate: lineups lock `LINEUP_LOCK_LEAD_MINUTES` before a period's first ball. */
  kickoffs: GameweekKickoff[];
  period: RosteredPeriod;
  snapshot: FootballSnapshot;
  /** The league-wide answer: what a reader may see of a team that is not his.
   *  One team a known reader is looking at gets `teamDisplay` instead. */
  display: RosterDisplay;
  /** Null when Fantrax would not describe the competition; the gate and the planner then degrade. */
  info: LeagueInfo | null;
  /** The period the round in view is scored in; `period.period` is Fantrax's, and the only one the gate judges. */
  roundPeriod: number | null;
}

/** The squads, an undrafted league (`NO_TEAMS`, a state) or Fantrax not answering (a fault): never one. */
export type LeagueSquads = ReadableSquads | { undrafted: string } | Unavailable;

/** The squads when Fantrax served them; null for an undrafted league or a silent one, which these readers treat alike. */
export function readable(squads: LeagueSquads): ReadableSquads | null {
  return "period" in squads ? squads : null;
}

/** The squads read's cache key, which a lineup save expires. */
export const SQUADS_KEY = "league-squads";

/** The squads, or the page a refusal belongs on: undrafted is a 404, unavailable goes `home`, where it is described. */
export function readableOr404(squads: LeagueSquads, home: string): ReadableSquads {
  if ("undrafted" in squads) notFound();
  if ("unavailable" in squads) redirect(home);
  return squads;
}

/** What the cache holds: plain data, since a `FantraxError` comes back from a round trip as a lookalike. */
interface CachedLeague {
  rosters: RawTeamRosters | null;
  refusal: { code: string; tell: string } | null;
  info: LeagueInfo | null;
  /** The period the round in view is scored in, or null; sent to `getTeamRosters` only through `periodToRead`. */
  roundPeriod: number | null;
}

/** The provider reads every squad view shares, cached across requests; nothing about who is asking may cross in. */
const readLeague = leagueCache(SQUADS_KEY,
  async (round: Round | null, currentGameweek: number): Promise<CachedLeague> => {
    // The round in view's period, which every per-period read wants; `periodToRead` decides whether Fantrax is asked it.
    const roundPeriod = round?.period ?? (await roundOf(currentGameweek))?.period ?? null;

    const [open, info, kickoffs] = await Promise.all([
      orRefusal(fetchTeamRosters(FANTRAX_LEAGUE_ID)),
      leagueInfo(),
      seasonKickoffs(),
    ]);

    // A second read for any round but the one Fantrax hands over unasked, whose label only the first read knows.
    const asked =
      open instanceof FantraxError
        ? null
        : periodToRead(
            roundPeriod,
            open.period ?? null,
            info?.rosterPeriods ?? [],
            kickoffs,
            now().toISOString(),
          );
    const rosters =
      asked === null ? open : await orRefusal(fetchTeamRosters(FANTRAX_LEAGUE_ID, asked));

    return rosters instanceof FantraxError
      ? { rosters: null, refusal: { code: rosters.code, tell: tell(rosters) }, info, roundPeriod }
      : { rosters, refusal: null, info, roundPeriod };
  },
  (error) => ({ rosters: null, refusal: { code: error.code, tell: tell(error) }, info: null, roundPeriod: null }),
);

export async function getLeagueSquads(round: Round | null = null): Promise<LeagueSquads> {
  // Kickoffs from their own cache, and the football snapshot read out here: a nested `unstable_cache` bypasses its own.
  const current = await footballNow();
  const [{ rosters, refusal, info, roundPeriod }, snapshot, kickoffs] = await Promise.all([
    readLeague(round, current.gameweek),
    round === null || round.gameweek === current.gameweek ? current : gameweekSnapshot(round.gameweek),
    seasonKickoffs(),
  ]);

  // Branching on one code, safe because it fails toward hedging: anything unrecognised is "not answering".
  if (refusal !== null || rosters === null) {
    const said = refusal ?? { code: "UNKNOWN", tell: "getTeamRosters → no answer" };
    return said.code === "NO_TEAMS" ? { undrafted: said.tell } : { unavailable: said.tell };
  }

  const held = mapTeamRosters(rosters);
  const period = resolveRosters(snapshot, { ...held, teams: shortTeamNames(held.teams) }, bridge);

  return {
    period,
    roundPeriod,
    snapshot,
    info,
    kickoffs,
    // The league-wide answer, on the payload's own period and with `false`: a reader's own here would leak rivals' XIs.
    display: rosterDisplay(
      period.period,
      info?.rosterPeriods ?? [],
      kickoffs,
      now().toISOString(),
      false,
    ),
  };
}

/** What the reader may see of one team's roster: his own always, every other once its lineups lock. */
export function teamDisplay(squads: ReadableSquads, yours: boolean): RosterDisplay {
  return rosterDisplay(
    squads.period.period,
    squads.info?.rosterPeriods ?? [],
    squads.kickoffs,
    now().toISOString(),
    yours,
  );
}

/** The reader's own team, or null, for a page that has not narrowed the squads itself; a cached lookup. */
export async function readerTeamId(): Promise<string | null> {
  const squads = await getLeagueSquads();
  return "period" in squads ? myTeamId(squads.period.teams) : null;
}
