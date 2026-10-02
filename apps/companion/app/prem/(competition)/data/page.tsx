import { clubById, onTheBooks, playerByCode, type FootballPlayer } from "@epl/core";
import PremShell from "../../Shell";
import { DATA } from "../../PremNav";
import { leagueOpinions } from "../../leagueOpinions";
import { poolHref } from "../../poolHref";
import { footballNow } from "../../../football";
import { getLeaguePool } from "../../../players/pool";
import { seasonMarks } from "../../../ratings";
import LeaderBoard, { type Row } from "./LeaderBoard";
import QuerySelect from "../../../components/shell/QuerySelect";
import { LISTS, MOST, TOP, asPrinted, listFor, ranked, seasonRatings, type Leader, type LeaderList } from "./leaders";

// The season's leaders as plain lists (Craig, 1 Oct 2026: "simple list like top scorer, top xg, top fantasy ratings etc
// ... with a top 50 for each"). A phone shows the list its picker names; the desk shows every list, the asked one to fifty.

// Must match `PAGE_REVALIDATE` in the app's config; `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

type Search = Promise<{ list?: string; n?: string }>;

/** The phone's picker, one entry a list. */
const PICKS = LISTS.map((list) => ({ value: list.key, label: list.title }));

export default async function DataPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const asked = listFor(query.list);
  const longest = query.n === String(MOST);

  const [snapshot, league, pool] = await Promise.all([footballNow(), leagueOpinions(), getLeaguePool()]);
  const players = snapshot.players.filter(onTheBooks);
  const byCode = playerByCode(snapshot);
  const clubs = clubById(snapshot);

  // Fantrax's points by FPL code, and only for a season played rather than projected.
  const points = new Map<number, number>();
  if (!("unavailable" in pool) && pool.season?.projected !== true) {
    for (const row of pool.rows) {
      const figure = row.stats?.points ?? null;
      if (row.fplCode !== null && figure !== null) points.set(row.fplCode, figure);
    }
  }
  const ratings = seasonRatings(seasonMarks());

  const leadersOf = (list: LeaderList): Leader[] => {
    const { source } = list;
    if (typeof source === "object") {
      return players.map((p) => ({ code: p.code, name: p.name, figure: asPrinted(list, source.fpl(p.season)) }));
    }
    const figures = source === "rating" ? ratings : points;
    return [...figures].flatMap(([code, figure]) => {
      const player = byCode.get(code);
      return player === undefined || !onTheBooks(player) ? [] : [{ code, name: player.name, figure: asPrinted(list, figure) }];
    });
  };

  const rowsOf = (list: LeaderList, n: number): Row[] =>
    ranked(leadersOf(list), n).map((leader) => {
      const player: FootballPlayer | undefined = byCode.get(leader.code);
      return { ...leader, club: player === undefined ? undefined : clubs.get(player.clubId), href: poolHref(league, leader.code) };
    });

  return (
    <PremShell current="data">
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5 lg:hidden">
        <QuerySelect name="list" label="List" value={asked.key} options={PICKS} action={DATA} />
      </div>
      <div className="grid items-start gap-2 lg:grid-cols-4">
        {LISTS.map((list) => {
          const open = list.key === asked.key && longest;
          return (
            <LeaderBoard
              key={list.key}
              list={list}
              rows={rowsOf(list, open ? MOST : TOP)}
              more={{ href: open ? `${DATA}?list=${list.key}` : `${DATA}?list=${list.key}&n=${MOST}`, label: open ? `Top ${TOP}` : `Top ${MOST}` }}
              className={list.key === asked.key ? "" : "max-lg:hidden"}
            />
          );
        })}
      </div>
    </PremShell>
  );
}
