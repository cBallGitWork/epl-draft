import {
  type GameweekKickoff,
  type InboxItem,
  type LeaguePeriod,
  type LeagueTeam,
  periodGameweeks,
  availabilityNews,
  availability,
  blockNews,
  dealNews,
  deals,
  headToHead,
  inboxItems,
  nextDeadline,
  offerNews,
  roundNews,
} from "@epl/core";
import { now } from "../clock";
import { readBoard } from "../board";
import { readDeals } from "../business";
import { readProposals, readTradeBlocks } from "../market";
import { seasonKickoffs } from "../football";
import { readerTeamId, getLeagueSquads } from "../squads";
import { signedTeamId } from "../session";

// What the manager's inbox is made of, from reads the paper and the head-to-head already cache.
// The football and league layers meet here, at the app edge, because neither may import the other.

export interface Inbox {
  items: InboxItem[];
  /** A team's name by id. */
  names: Map<string, string>;
  /** The reader's own team, or null signed out, when nothing goes red. */
  mine: string | null;
  /** The trades on the table he is party to, also in `items`: the banner's. */
  offers: InboxItem[];
}

/** Who he plays in the period the NEXT deadline locks: his doubts and that opponent's are the inbox's. */
function nextOpponent(
  matchups: Parameters<typeof headToHead>[0],
  teams: Parameters<typeof headToHead>[1],
  period: number | null,
  mine: string | null,
): string | null {
  if (period === null || mine === null) return null;
  return headToHead(matchups, teams, period, mine)?.opponent.teamId ?? null;
}

export async function readInbox(): Promise<Inbox> {
  const [squads, feed, mine, kickoffs, blocks, proposals] = await Promise.all([
    getLeagueSquads(),
    readDeals(),
    readerTeamId(),
    seasonKickoffs(),
    readTradeBlocks(),
    readProposals(),
  ]);

  const drafted = "period" in squads ? squads : null;
  const names = new Map(
    (drafted?.info?.teams ?? []).map((team) => [team.teamId, team.name] as const),
  );
  const nameOf = (teamId: string) => names.get(teamId) ?? null;
  const holders = new Map(
    (drafted?.period.teams ?? []).flatMap((team) => team.players.map((man) => [man.slot.fantraxId, team.teamId] as const)),
  );
  const gameweek = drafted?.snapshot.gameweek ?? null;

  // Unsorted: `inboxItems` files every doubt by its `news_added` date.
  const doubts = drafted ? availability(drafted.period.teams) : [];

  const board = drafted === null ? null : await readBoard(drafted);
  const period = drafted?.roundPeriod ?? null;

  // The next lock says when the gameweek closes and which gameweek the doubts are about.
  const next = drafted?.info == null ? null : lock(drafted.info.rosterPeriods, kickoffs);
  const opponent =
    drafted?.info == null
      ? null
      : nextOpponent(drafted.info.matchups, drafted.info.teams, next?.period ?? null, mine);

  // His own tie only; the rest are on Results.
  const tie =
    board === null || drafted?.info == null || mine === null || period === null
      ? undefined
      : headToHead(drafted.info.matchups, drafted.info.teams, period, mine);
  const yours = tie === undefined || board === null ? null : finishedTie(board, tie);

  // A proposal is private to its two managers, so only a code reads one: never the lent demo team.
  const signed = drafted === null ? null : await signedTeamId(drafted.period.teams);
  const offers = offerNews(proposals.proposals, { name: nameOf, mine: signed, zone: proposals.zone });

  return {
    items: inboxItems(
      offers,
      // `deals()` pairs a claim with its drop and both halves of a trade.
      dealNews(deals(feed.rows), nameOf, mine),
      blockNews(blocks, { name: nameOf, mine, holder: (fantraxId) => holders.get(fantraxId) ?? null }),
      roundNews({
        gameweek,
        // The paper's own `nextDeadline`, so the inbox and the paper print one time.
        deadline: next,
        yours,
      }),
      // The gameweek he can still pick for; never `?? gameweek`, which is the one already played.
      availabilityNews(doubts, next?.gameweek ?? null, { mine, opponent, name: nameOf }),
    ),
    names,
    mine,
    offers,
  };
}

/** The reader's own tie once both sides have none to play; `points` is a nought before kickoff, and a null `toPlay` is open. */
function finishedTie(
  board: NonNullable<Awaited<ReturnType<typeof readBoard>>>,
  tie: { team: LeagueTeam; opponent: LeagueTeam },
): { opponent: string; points: number | null; against: number | null } | null {
  const mine = board.scores.get(tie.team.teamId);
  const theirs = board.scores.get(tie.opponent.teamId);
  if (mine?.toPlay !== 0 || theirs?.toPlay !== 0) return null;
  return {
    opponent: tie.opponent.name,
    points: mine.points ?? null,
    against: theirs.points ?? null,
  };
}

/** The next lock, its period and the gameweek it locks (not `snapshot.gameweek`, the one played); null if either is missing. */
function lock(
  periods: readonly LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
): { period: number; gameweek: number; locksAt: string } | null {
  const next = nextDeadline(periods, kickoffs, now().toISOString());
  if (next === null) return null;
  const rounds = periodGameweeks([...periods], [...kickoffs]).find(
    (entry) => entry.period === next.period,
  );
  // A period spanning two gameweeks locks before the first.
  const gameweek = rounds?.gameweeks[0];
  return gameweek === undefined
    ? null
    : { period: next.period, gameweek, locksAt: next.locksAt };
}

/** The offer the banner names: the newest the reader is party to, and the manager across the table from him. */
export function bannerOffer(inbox: Inbox): { id: string; with: string | null } | null {
  const [first] = inbox.offers;
  if (first === undefined) return null;
  return { id: first.id, with: first.teamId === null ? null : (inbox.names.get(first.teamId) ?? null) };
}
