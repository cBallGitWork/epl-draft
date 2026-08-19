import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  PAGE_REVALIDATE,
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
  duringGameweek,
  fetchTransactions,
  mapTransactions,
  nextDeadline,
  teamOfTheWeek,
} from "@epl/core";
import { orRefusal } from "./refusals";
import { getLeagueSquads } from "./squads";

// What today's paper is made of.
//
// The builders in core decide what is true; this decides what runs. A section
// with nothing to say does not appear — an edition padded out with "no
// transactions this week" is a worse paper than a shorter one, and there is no
// house style worth defending that requires printing an empty box.

export interface Edition {
  /** Football on right now, which changes what the paper leads with. */
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
const readDeals = unstable_cache(
  async () => {
    const feeds = await Promise.all(
      DEAL_VIEWS.map(async (view) => {
        const raw = await orRefusal(fetchTransactions(FANTRAX_LEAGUE_ID, view));
        return raw instanceof FantraxError ? [] : mapTransactions(raw, view);
      }),
    );
    return feeds.flat();
  },
  ["gazette-deals", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

export async function edition(mine: string | null): Promise<Edition> {
  const [squads, transactions] = await Promise.all([getLeagueSquads(), readDeals()]);
  const drafted = "period" in squads ? squads : null;
  const now = new Date().toISOString();

  return {
    live: drafted ? duringGameweek(drafted.snapshot, now) : false,
    snapshot: drafted?.snapshot ?? null,
    deals: deals(transactions),
    availability: drafted ? yoursFirst(availability(drafted.period.teams), mine) : [],
    deadline: drafted?.info ? nextDeadline(drafted.info.rosterPeriods, now) : null,
    teams: drafted?.info?.teams ?? [],
    eleven: eleven(drafted),
    mine,
  };
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

/** Your problems first. A manager scanning injury news on a Friday is looking
 *  for his own name before anybody else's. */
function yoursFirst(notes: AvailabilityNote[], mine: string | null): AvailabilityNote[] {
  if (mine === null) return notes;
  return [...notes].sort((a, b) => Number(b.teamId === mine) - Number(a.teamId === mine));
}
