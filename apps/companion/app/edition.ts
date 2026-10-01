import {
  type AvailabilityNote,
  type Deadline,
  type Deal,
  type FootballSnapshot,
  type PublishedStory,
  type Story,
  type LeagueInfo,
  type RosteredTeam,
  type LeagueTeam,
  type TeamOfTheWeek,
  availability,
  deals,
  frontPage,
  isMatchdayLive,
  nextDeadline,
  stories,
  teamOfTheWeek,
  wasFielded,
} from "@epl/core";
import { now } from "./clock";
import { type Board, readBoard } from "./board";
import { readDeals } from "./business";
import { roundUnderway, seasonKickoffs } from "./football";
import { yoursFirst } from "./mine";
import { filed } from "./paper";
import { type LeagueSquads, getLeagueSquads } from "./squads";

// What today's paper is made of.
//
// The builders in core decide what is true; this decides what runs. A section
// with nothing to say does not appear — an edition padded out with "no
// transactions this week" is a worse paper than a shorter one, and there is no
// house style worth defending that requires printing an empty box.

/** Why the paper has nothing to print, when it has nothing.
 *
 *  Three states rather than one flag, because they are three different sentences
 *  and only one of them is about us. `squads.ts` keeps the first two apart at
 *  some length — "collapsing the two tells sixteen managers with squads that
 *  nobody has drafted yet, because Fantrax blipped for five minutes" — and the
 *  front page is the last place that should throw the distinction away. */
export type Silence =
  | { kind: "unavailable"; code: string }
  | { kind: "undrafted"; code: string }
  | { kind: "quiet" };

export interface Edition {
  /** Null when there is something to print. */
  silence: Silence | null;
  /** Fantrax's own heading for the transaction date column — "Date (EDT)". Shown
   *  because their timestamps carry no offset, so without it a British reader
   *  takes a New York morning for a British one. Null if they stop saying. */
  dealsAt: string | null;
  /** Football in play *right now*, which changes what the paper leads with.
   *
   *  `isMatchdayLive` and deliberately not `duringGameweek`: this drives a
   *  present-tense claim ("the scores are moving") and a pulsing dot, and
   *  `duringGameweek` is the wider window that stays open between kickoffs and
   *  overnight. It was that wider one, which put a live dot on the front page for
   *  about sixty-one of GW1's seventy-four hours. `round.ts` says which question
   *  is which, and the rest of the app already asks this one through
   *  `roundState`. */
  live: boolean;
  /** Whether the round in view is running — first kickoff to last whistle,
   *  including every gap between matches.
   *
   *  The third of three round questions on this edition, and they are three
   *  because `round.ts` records that each has been got wrong by being asked in
   *  place of another. `live` is "a ball is in the air" and drives the dot and
   *  the present tense. `partial` is "there is football still to come" and is
   *  what withholds the lead. This one is "there is a score worth printing",
   *  which is neither: before the first kickoff every total is a legitimate
   *  nought, and a strip reading 0–0 across eight ties would be reporting a
   *  round nobody has played. */
  underway: boolean;
  /** The round this edition is about, printed on the masthead as its number.
   *  Null before a round exists, when the plate prints the price alone. */
  round: number | null;
  snapshot: FootballSnapshot | null;
  deals: Deal[];
  availability: AvailabilityNote[];
  deadline: Deadline | null;
  teams: LeagueTeam[];
  /** Null until somebody has actually played. */
  eleven: TeamOfTheWeek | null;
  /** Whether the round the eleven is picked from is still being played.
   *
   *  A team of the week chosen from four of ten fixtures is not the week's
   *  eleven, it is the week so far — and it does not merely leave men out, it
   *  admits the wrong ones: every good forward in the league was still to kick
   *  off on Saturday tea-time, so two of the three forward slots went to men
   *  with no goal, no assist and no clean sheet while a midfielder level with
   *  the best defender missed out on a full quota. The section says which it is
   *  rather than the reader having to know the fixture list.
   *
   *  Read by the lead as well, for the same reason said the other way round: a
   *  week still being played has no story anybody can stand behind yet. */
  partial: boolean;
  /** Whether the arrangement the eleven was read from is the one that was
   *  actually fielded in the round it reports on.
   *
   *  `getTeamRosters` is asked for no period and labels its answer with the one
   *  Fantrax considers open — and Fantrax rolls that label forward well ahead of
   *  the boundary. At 08:29Z on the Friday of period 1, ten and a half hours
   *  before period 1 closed, it was already answering period 2. So between
   *  rounds the lineup on hand can be next week's plan, and "he left him on the
   *  bench" becomes a statement about a side nobody fielded.
   *
   *  Every claim about who was STARTED is withheld when this is false. What the
   *  players did is football and stands either way, which is why the eleven
   *  itself still prints. */
  fielded: boolean;
  /** The rolling paper in print order, the first story leading; `frontPage` owns
   *  expiry, supersession, the order and the kinds it leaves off. */
  filed: PublishedStory[];
  /** Every story the week produced, strongest first: the front page leads on the
   *  first and runs the rest as headlines under it. Empty is ordinary — a paper
   *  does not manufacture a story, so most of the week there is nothing here. */
  stories: Story[];
  /** This period's ties and Fantrax's totals for them, or null when there is no
   *  round to report. One read, two readers: the scoreboard prints it while football
   *  is on, and `stories()` decides the week's running order from it once the
   *  football stops. Reading it twice would be two cache lookups and two chances
   *  for the page to disagree with itself about the score. */
  board: Board | null;
  /** The reader's own team, when they have signed in. Sections order themselves
   *  around it rather than being neutral. */
  mine: string | null;
}

export async function edition(mine: string | null): Promise<Edition> {
  const [squads, feed, kickoffs] = await Promise.all([
    getLeagueSquads(),
    readDeals(),
    seasonKickoffs(),
  ]);
  const drafted = "period" in squads ? squads : null;
  const at = now().toISOString();

  // Any dated fixture still to finish. Undated ones are ignored on the same rule
  // the football layer uses everywhere: a TV pick with no time cannot hold a
  // round open.
  const partial =
    drafted?.snapshot.fixtures.some(
      (fixture) => fixture.kickoff !== null && fixture.status !== "finished",
    ) ?? false;
  const fielded = drafted !== null && wasFielded(drafted.period, drafted.roundPeriod);

  // The clock is read here, at the app edge, beside the other two — never inside
  // a builder. `football.ts` is where that rule lives.
  const underway = drafted ? roundUnderway(drafted.snapshot) : false;
  /** The period the paper is about, and the only one anything here may ask for. */
  const roundPeriod = drafted?.roundPeriod ?? null;

  const business = deals(feed.rows);
  const picked = eleven(drafted);
  const board = drafted === null ? null : await readBoard(drafted);
  // The desk's own manufactured stories wait for the round to finish: unlike a
  // filed column they carry no dateline, so mid-round they would claim the
  // week. (The filed lead prints at all times — gazetta.md records the
  // reversal and where its safety went.)
  const told =
    board === null || partial
      ? []
      : stories(board.pairings, board.scores, fielded ? picked : null, business, roundPeriod);

  const paper = {
    live: drafted ? isMatchdayLive(drafted.snapshot) : false,
    round: roundPeriod,
    snapshot: drafted?.snapshot ?? null,
    deals: business,
    dealsAt: feed.at,
    // Your problems first: a manager scanning injury news on a Friday is
    // looking for his own name before anybody else's.
    availability: drafted
      ? yoursFirst(availability(drafted.period.teams), (note) => note.teamId === mine)
      : [],
    deadline: drafted?.info ? nextDeadline(drafted.info.rosterPeriods, kickoffs, at) : null,
    teams: drafted?.info?.teams ?? [],
    eleven: picked,
    partial,
    underway,
    fielded,
    stories: told,
    // The clock is the app edge's to read (`football.ts`'s rule), which is why
    // the compose happens here rather than in `paper.ts`.
    filed: frontPage(filed, at),
    board,
    mine,
  };

  return { ...paper, silence: silenceOf(squads, paper) };
}

/** What the paper is short of, if anything.
 *
 *  A quiet week is a real answer and not the same as an outage: the league is
 *  there, we can read it, and nobody has done anything. It says so rather than
 *  borrowing the undrafted sentence, which would tell a drafted league it has not
 *  drafted. Transactions are read separately from the squads, so a league with
 *  business but no squads still has a paper. */
function silenceOf(squads: LeagueSquads, paper: Omit<Edition, "silence">): Silence | null {
  // Only when there is nothing at all to print. A page with the week's business
  // on it does not need a panel explaining that the rest is missing, and the
  // transaction feed is read separately from the squads — so an outage can still
  // leave a paper worth reading.
  const empty =
    paper.eleven === null &&
    paper.deals.length === 0 &&
    paper.availability.length === 0 &&
    paper.deadline === null &&
    paper.filed.length === 0;
  if (!empty) return null;

  if ("unavailable" in squads) return { kind: "unavailable", code: squads.unavailable };
  if ("undrafted" in squads) return { kind: "undrafted", code: squads.undrafted };
  return { kind: "quiet" };
}

/** The week's eleven, once there is a week to pick it from.
 *
 *  Null rather than an empty side before a ball is kicked: a team of the week
 *  with nobody in it is not a shorter section, it is a wrong one. */
function eleven(drafted: { period: { teams: RosteredTeam[] }; info: LeagueInfo | null } | null) {
  if (!drafted?.info) return null;
  const picked = teamOfTheWeek(drafted.period.teams, drafted.info.roster);
  return picked.picks.length === 0 ? null : picked;
}

