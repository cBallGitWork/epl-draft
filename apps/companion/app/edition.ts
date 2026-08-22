import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type AvailabilityNote,
  type Deadline,
  type Deal,
  type FootballSnapshot,
  type LeagueInfo,
  type RosteredTeam,
  type LeagueTeam,
  type TeamOfTheWeek,
  type TransactionView,
  availability,
  deals,
  fetchTransactions,
  isMatchdayLive,
  mapTransactions,
  transactionDateLabel,
  nextDeadline,
  teamOfTheWeek,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { seasonKickoffs } from "./football";
import { yoursFirst } from "./mine";
import { orRefusal } from "./refusals";
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
  snapshot: FootballSnapshot | null;
  deals: Deal[];
  availability: AvailabilityNote[];
  deadline: Deadline | null;
  teams: LeagueTeam[];
  /** Null until somebody has actually played. */
  eleven: TeamOfTheWeek | null;
  /** The reader's own team, when they have signed in. Sections order themselves
   *  around it rather than being neutral. */
  mine: string | null;
}

/** The views that make up a week's business.
 *
 *  Two reads rather than one because for a trade the view IS the type: trade rows
 *  carry no `transactionCode`, so a paper reading only `CLAIM_DROP` reports every
 *  waiver claim in the league and none of its trades.
 *
 *  `LINEUP_CHANGE` is captured daily but deliberately not read here. Benching
 *  somebody is not business anyone did with anyone, and on sixteen teams it would
 *  bury the two moves that are. */
const DEAL_VIEWS: readonly TransactionView[] = ["CLAIM_DROP", "TRADE"];

/** The transaction feed, cached and failure-tolerant.
 *
 *  A claim log we cannot read costs the paper a section, not the paper — and one
 *  view refusing costs it only that view, which is why each is caught on its own.
 *  It is its own cache entry rather than part of the squads read because it
 *  changes on a completely different rhythm — a few times a week, against every
 *  thirty seconds on a Saturday. */
const readDeals = leagueCache("gazette-deals",
  async () => {
    const feeds = await Promise.all(
      DEAL_VIEWS.map(async (view) => {
        const raw = await orRefusal(fetchTransactions(FANTRAX_LEAGUE_ID, view));
        if (raw instanceof FantraxError) return { rows: [], at: null };
        return { rows: mapTransactions(raw, view), at: transactionDateLabel(raw) };
      }),
    );
    return {
      rows: feeds.flatMap((feed) => feed.rows),
      // Every view heads the column the same way; the first that answered wins.
      at: feeds.map((feed) => feed.at).find((label) => label !== null) ?? null,
    };
  },
);

export async function edition(mine: string | null): Promise<Edition> {
  const [squads, feed, kickoffs] = await Promise.all([
    getLeagueSquads(),
    readDeals(),
    seasonKickoffs(),
  ]);
  const drafted = "period" in squads ? squads : null;
  const now = new Date().toISOString();

  const paper = {
    live: drafted ? isMatchdayLive(drafted.snapshot) : false,
    snapshot: drafted?.snapshot ?? null,
    deals: deals(feed.rows),
    dealsAt: feed.at,
    // Your problems first: a manager scanning injury news on a Friday is
    // looking for his own name before anybody else's.
    availability: drafted
      ? yoursFirst(availability(drafted.period.teams), (note) => note.teamId === mine)
      : [],
    deadline: drafted?.info ? nextDeadline(drafted.info.rosterPeriods, kickoffs, now) : null,
    teams: drafted?.info?.teams ?? [],
    eleven: eleven(drafted),
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
    paper.deadline === null;
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

