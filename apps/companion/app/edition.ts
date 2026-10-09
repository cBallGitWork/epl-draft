import {
  type Deadline,
  type Deal,
  type FootballSnapshot,
  type PublishedStory,
  type Story,
  type LeagueInfo,
  type RosteredTeam,
  type LeagueTeam,
  type TeamOfTheWeek,
  deals,
  composePaper,
  isMatchdayLive,
  nextDeadline,
  stories,
  teamOfTheWeek,
  wasFielded,
} from "@epl/core";
import { now } from "./clock";
import { type Board, readBoard } from "./board";
import { readDeals } from "./business";
import { periodPoints } from "./scoreboard";
import { roundUnderway, seasonKickoffs } from "./football";
import { filed } from "./paper";
import { type LeagueSquads, getLeagueSquads, readable } from "./squads";

// What today's paper is made of: core's builders decide what is true, this decides what runs.

/** Why the paper has nothing to print: three different sentences, so never one flag. */
export type Silence =
  | { kind: "unavailable"; code: string }
  | { kind: "undrafted"; code: string }
  | { kind: "quiet" };

export interface Edition {
  /** Null when there is something to print. */
  silence: Silence | null;
  /** A ball is in the air (`isMatchdayLive`, not the wider `duringGameweek`): the dot and the present tense. */
  live: boolean;
  /** First kickoff to last whistle, gaps included: there is a score worth printing. */
  underway: boolean;
  snapshot: FootballSnapshot | null;
  deals: Deal[];
  deadline: Deadline | null;
  teams: LeagueTeam[];
  /** Null until somebody has actually played. */
  eleven: TeamOfTheWeek | null;
  /** Football still to come this gameweek: the eleven says "so far" and the desk's own stories wait. */
  partial: boolean;
  /** The lineup on hand is the one fielded (Fantrax rolls its period forward early); false withholds who STARTED. */
  fielded: boolean;
  /** The rolling paper in print order; `composePaper` owns expiry, supersession and order. */
  filed: PublishedStory[];
  /** The desk's own stories for the week, strongest first; empty most of the week. */
  stories: Story[];
  /** This period's ties and Fantrax's totals, read once for the scoreboard and `stories()`. */
  board: Board | null;
  /** The reader's own team, when they have signed in. */
  mine: string | null;
}

export async function edition(mine: string | null): Promise<Edition> {
  const [squads, feed, kickoffs] = await Promise.all([
    getLeagueSquads(),
    readDeals(),
    seasonKickoffs(),
  ]);
  const drafted = readable(squads);
  const at = now().toISOString();

  // Any dated fixture still to finish; an undated one cannot hold a gameweek open.
  const partial =
    drafted?.snapshot.fixtures.some(
      (fixture) => fixture.kickoff !== null && fixture.status !== "finished",
    ) ?? false;
  const fielded = drafted !== null && wasFielded(drafted.period, drafted.roundPeriod);

  const underway = drafted ? roundUnderway(drafted.snapshot) : false;
  /** The period the paper is about, and the only one anything here may ask for. */
  const roundPeriod = drafted?.roundPeriod ?? null;

  const business = deals(feed.rows);
  const picked = eleven(drafted, roundPeriod === null ? new Map() : await periodPoints(roundPeriod));
  const board = drafted === null ? null : await readBoard(drafted);
  // The desk's own stories carry no dateline, so they wait for the gameweek to finish.
  const told =
    board === null || partial
      ? []
      : stories(board.pairings, board.scores, fielded ? picked : null, business, roundPeriod);

  const paper = {
    live: drafted ? isMatchdayLive(drafted.snapshot) : false,
    snapshot: drafted?.snapshot ?? null,
    deals: business,
    deadline: drafted?.info ? nextDeadline(drafted.info.rosterPeriods, kickoffs, at) : null,
    teams: drafted?.info?.teams ?? [],
    eleven: picked,
    partial,
    underway,
    fielded,
    stories: told,
    // Composed here because the clock is the app edge's to read.
    filed: composePaper(filed, at),
    board,
    mine,
  };

  return { ...paper, silence: silenceOf(squads, paper) };
}

/** What the paper is short of, only when there is nothing at all to print; a quiet week is not an outage. */
function silenceOf(squads: LeagueSquads, paper: Omit<Edition, "silence">): Silence | null {
  const empty =
    paper.eleven === null &&
    paper.deals.length === 0 &&
    paper.deadline === null &&
    paper.filed.length === 0;
  if (!empty) return null;

  if ("unavailable" in squads) return { kind: "unavailable", code: squads.unavailable };
  if ("undrafted" in squads) return { kind: "undrafted", code: squads.undrafted };
  return { kind: "quiet" };
}

/** The week's eleven, or null before anybody has played. */
function eleven(
  drafted: { period: { teams: RosteredTeam[] }; info: LeagueInfo | null } | null,
  points: ReadonlyMap<string, number>,
) {
  if (!drafted?.info) return null;
  const picked = teamOfTheWeek(drafted.period.teams, drafted.info.roster, points);
  return picked.picks.length === 0 ? null : picked;
}

