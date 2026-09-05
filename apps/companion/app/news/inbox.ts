import {
  type InboxItem,
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
import { yoursFirst } from "../mine";
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
  gameweek: number | null;
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
  const doubts = drafted
    ? yoursFirst(availability(drafted.period.teams), (note) => note.teamId === mine)
    : [];

  const board = drafted === null ? null : await readBoard(drafted);
  const period = drafted?.roundPeriod ?? null;

  // His own tie, and only his own. The game files what the CLUB was told, and a
  // manager was not told the score of a match he was not in — the rest are on
  // Results, which is a table and reads better as one.
  const tie =
    board === null || drafted?.info == null || mine === null || period === null
      ? undefined
      : headToHead(drafted.info.matchups, drafted.info.teams, period, mine);
  const yours =
    tie === undefined || board === null
      ? null
      : {
          opponent: tie.opponent.name,
          points: board.scores.get(tie.team.teamId)?.points ?? null,
          against: board.scores.get(tie.opponent.teamId)?.points ?? null,
        };

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
        deadline:
          drafted?.info == null
            ? null
            : (nextDeadline(drafted.info.rosterPeriods, kickoffs, new Date().toISOString())
                ?.locksAt ?? null),
        yours,
      }),
      availabilityNews(doubts, gameweek, mine),
    ),
    names,
    mine,
    gameweek,
  };
}
