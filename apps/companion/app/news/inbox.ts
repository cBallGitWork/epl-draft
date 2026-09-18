import {
  type GameweekKickoff,
  type InboxItem,
  type LeaguePeriod,
  type LeagueTeam,
  periodGameweeks,
  availabilityNews,
  availability,
  dealNews,
  deals,
  headToHead,
  inboxItems,
  nextDeadline,
  roundNews,
} from "@epl/core";
import { readBoard } from "../board";
import { readDeals } from "../business";
import { seasonKickoffs } from "../football";
import { readerTeamId, getLeagueSquads } from "../squads";

// What the manager's inbox is made of, kept out of the route for the reason
// `edition.ts` and `scoreboard.ts` are: three provider reads with three
// different tolerances for failure is not what a page file should be about.
//
// **Nothing here is a new read.** Every one of these is already fetched and
// cached for something else — the transaction feed by the Gazetta, the squads
// and the scoreboard by the head-to-head board, the kickoffs by the calendar
// seam. A sixth screen that costs nothing on a Saturday is the whole reason the
// inbox is built out of what the paper already gathers rather than out of a
// feed of its own.
//
// **The join is here and not in core**, on CLAUDE.md's rule: the doubts come
// from the football layer (FPL's own `news`), the rosters and the business from
// the league layer, and neither may import the other. A selector at the app edge
// is where they meet — the same seam `matchday/wireLines.ts` sits on.

export interface Inbox {
  items: InboxItem[];
  /** A team's name by id, for the list to print alongside an item. Built once
   *  here rather than looked up per row. */
  names: Map<string, string>;
  /** The reader's own team, or null when nobody is signed in. The inbox is
   *  still worth reading signed out — it is the league's news as well as his —
   *  but nothing goes red. */
  mine: string | null;
}

/** The two squads whose doubts a manager is entitled to care about.
 *
 *  **His own and the one he plays next** (Craig, 17 Sep 2026). The pair is
 *  resolved against the round the NEXT deadline belongs to rather than the round
 *  in view: for most of a week those are different, and the opponent worth
 *  knowing about is the one whose team you have still to pick against.
 *
 *  Typed off `headToHead`'s own parameters rather than off `LeagueMatchup`,
 *  which the barrel does not export — widening it for one private helper is the
 *  rule of 2/3 answered at one. */
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
  const [squads, feed, mine, kickoffs] = await Promise.all([
    getLeagueSquads(),
    readDeals(),
    readerTeamId(),
    seasonKickoffs(),
  ]);

  const drafted = "period" in squads ? squads : null;
  const names = new Map(
    (drafted?.info?.teams ?? []).map((team) => [team.teamId, team.name] as const),
  );
  const nameOf = (teamId: string) => names.get(teamId) ?? null;
  const gameweek = drafted?.snapshot.gameweek ?? null;

  // A league with no draft, or a Fantrax that would not answer, costs the two
  // tabs that need a roster and nothing else — which is the same failure
  // tolerance the paper has and for the same reason.
  //
  // **Unsorted, and that is the change.** This used to run the notes through
  // `yoursFirst`, on the argument that it kept the reader's own men at the top of
  // thirty rows. Two things retired it: the list is two squads deep now rather
  // than ten, and every doubt carries FPL's own `news_added`, so the merge sorts
  // them into the feed by date like everything else. A hand-ordering that the
  // sort then undoes is a line that reads as a decision and does nothing.
  const doubts = drafted ? availability(drafted.period.teams) : [];

  const board = drafted === null ? null : await readBoard(drafted);
  const period = drafted?.roundPeriod ?? null;

  // The next lock, which answers two questions at once: when the round closes,
  // and which round the doubts are about. They were read off `snapshot.gameweek`
  // before, which is the round whose football has been PLAYED — so an injury
  // list headed "gameweek 4" was about a round nobody could pick for any more.
  const next = drafted?.info == null ? null : lock(drafted.info.rosterPeriods, kickoffs);
  const opponent =
    drafted?.info == null
      ? null
      : nextOpponent(drafted.info.matchups, drafted.info.teams, next?.period ?? null, mine);

  // His own tie, and only his own. The game files what the CLUB was told, and a
  // manager was not told the score of a match he was not in — the rest are on
  // Results, which is a table and reads better as one.
  const tie =
    board === null || drafted?.info == null || mine === null || period === null
      ? undefined
      : headToHead(drafted.info.matchups, drafted.info.teams, period, mine);
  const yours = tie === undefined || board === null ? null : finishedTie(board, tie);

  return {
    items: inboxItems(
      // `deals()` first, which is what turns Fantrax's rows into stories: it
      // pairs a claim with the drop that paid for it and both halves of a trade
      // on their shared `setId`. Reading the rows straight would file a manager
      // signing a player and, separately and mysteriously, losing one.
      dealNews(deals(feed.rows), nameOf),
      roundNews({
        gameweek,
        // **`nextDeadline`, which is the paper's own builder** — the
        // commissioner's fifteen minutes before the round's first kickoff,
        // derived in one place so the inbox and the masthead cannot print
        // different times. It answers the NEXT one rather than this round's,
        // which is the right question for an inbox: a deadline that has passed
        // is not news, it is history.
        deadline: next,
        yours,
      }),
      // The round he can still act on, not the one in view. `nextOpponent` reads
      // the tie from the same period, so the two halves of "whose doubts matter"
      // cannot disagree.
      // **`?? null` and never `?? gameweek`.** Falling back to `snapshot.gameweek`
      // here is the exact bug the comment above says this removes: that is the
      // round whose football has been PLAYED, so a league with no next lock would
      // go straight back to heading the list "is out for GW4" about a round
      // nobody can pick for. `headlineState` and `doubtBody` both drop the round
      // cleanly on null, which is the one answer that says nothing false.
      availabilityNews(doubts, next?.gameweek ?? null, { mine, opponent, name: nameOf }),
    ),
    names,
    mine,
  };
}

/** The reader's own tie, but only once it is OVER.
 *
 *  **The guard this had was no guard at all.** `roundNews` documents its `yours`
 *  as "the reader's own FINISHED tie, or null while it is unplayed", and the only
 *  test of that was `points !== null` — which Fantrax satisfies every render.
 *  `livescoring.ts` says so in as many words: `totalFpts` is "a genuine nought
 *  until a ball is kicked", never null. So the inbox filed a completed-match
 *  report on a round that had not started — *"You drew with testf in gameweek 3.
 *  0 to 0."* — every day of the week, and at half time on a Saturday it filed
 *  *"testf beat you"* on CM's red URGENT ground about a match still being played,
 *  flipping back when the score turned. Nothing on the row said it was
 *  provisional: the item carries no time, so the blue block reads `GW3`.
 *
 *  `toPlay` is the field that answers it, and `board` already carries it —
 *  `board.ts` says in writing that it is "how the paper knows a match is over
 *  rather than merely quiet", and `gazette/stories.ts` gates the paper's own tie
 *  report on exactly this pair. **Null is not zero**: `tieState` records that a
 *  `toPlay` Fantrax did not give "can never" be read as none left, so an
 *  unanswered side leaves the tie open rather than closing it. */
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

/** The next lock, and the ROUND it locks — which is not the round in view.
 *
 *  `nextDeadline` answers "what is coming up" and carries the period it belongs
 *  to; a period is not a gameweek, so `periodGameweeks` resolves it against the
 *  football calendar the same way `write-edition` does. The item used
 *  `snapshot.gameweek` instead, and the two agree only on the two days between a
 *  round finishing and the next deadline passing — so for most of every week the
 *  row read "Gameweek 3 lineups lock" over a date that was GW4's.
 *
 *  Null when either half is missing: a lock with no round to name is a date with
 *  no sentence, and this screen would rather say nothing.
 *
 *  **It hands back the PERIOD as well**, which is not the deadline item's
 *  business but is every other caller's: the doubts are about this round and the
 *  opponent is the one this round pairs him with, and both would otherwise be
 *  resolved a second time and be free to disagree. */
function lock(
  periods: readonly LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
): { period: number; gameweek: number; locksAt: string } | null {
  const next = nextDeadline(periods, kickoffs, new Date().toISOString());
  if (next === null) return null;
  const rounds = periodGameweeks([...periods], [...kickoffs]).find(
    (entry) => entry.period === next.period,
  );
  // The FIRST gameweek of the period, because that is the one the lock lets a
  // manager into — a period spanning two rounds locks before the first of them.
  const gameweek = rounds?.gameweeks[0];
  return gameweek === undefined
    ? null
    : { period: next.period, gameweek, locksAt: next.locksAt };
}
