import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  PAGE_REVALIDATE,
  type AvailabilityNote,
  type Deadline,
  type Deal,
  type FootballSnapshot,
  type LeagueTeam,
  availability,
  deals,
  duringGameweek,
  fetchTransactions,
  mapTransactions,
  nextDeadline,
} from "@epl/core";
import { orRefusal } from "./refusals";
import { getLeagueSquads } from "./squad/league";

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
  /** The reader's own team, when they have signed in. Sections order themselves
   *  around it rather than being neutral. */
  mine: string | null;
}

/** The transaction feed, cached and failure-tolerant.
 *
 *  A claim log we cannot read costs the paper a section, not the paper. It is
 *  its own cache entry rather than part of the squads read because it changes on
 *  a completely different rhythm — a few times a week, against every thirty
 *  seconds on a Saturday. */
const readDeals = unstable_cache(
  async () => {
    const raw = await orRefusal(fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP"));
    if (raw instanceof FantraxError) return [];
    return mapTransactions(raw, "CLAIM_DROP");
  },
  ["gazette-claims", FANTRAX_LEAGUE_ID],
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
    mine,
  };
}

/** Your problems first. A manager scanning injury news on a Friday is looking
 *  for his own name before anybody else's. */
function yoursFirst(notes: AvailabilityNote[], mine: string | null): AvailabilityNote[] {
  if (mine === null) return notes;
  return [...notes].sort((a, b) => Number(b.teamId === mine) - Number(a.teamId === mine));
}
