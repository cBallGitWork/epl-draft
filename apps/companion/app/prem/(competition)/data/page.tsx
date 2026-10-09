import { clubById, londonDayAndDate, onTheBooks, playerByCode, type FootballPlayer } from "@epl/core";
import PremShell from "../../Shell";
import { DATA } from "../../PremNav";
import { leagueOpinions } from "../../leagueOpinions";
import { poolHref } from "../../poolHref";
import { footballNow } from "../../../football";
import { getLeaguePool } from "../../../players/pool";
import { seasonMarks } from "../../../ratings";
import { intelStats, intelStatsManifest } from "../../../intel";
import LeaderBoard, { type Row } from "./LeaderBoard";
import QuerySelect from "../../../components/shell/QuerySelect";
import { defconPricing, poolPositions } from "../../../defcon";
import { HEADING_PLATE, MINOR_LABEL } from "@/app/desk";
import { LISTS, MOST, SECTIONS, TOP, leadersOf, listFor, ranked, seasonRatings, type LeaderList } from "./leaders";

// The season's leaders as plain lists, each to fifty on asking (Craig, 1 Oct 2026).
// A phone shows the list its picker names; the desk shows every list by section, the asked one to fifty.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

type Search = Promise<{ list?: string; n?: string }>;

/** A section's span and columns on the desk, by how many lists it holds; written out for Tailwind. */
const SPAN: Record<number, string> = {
  1: "lg:col-span-1 lg:grid-cols-1",
  2: "lg:col-span-2 lg:grid-cols-2",
  3: "lg:col-span-3 lg:grid-cols-3",
  4: "lg:col-span-4 lg:grid-cols-4",
};

export default async function DataPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const longest = query.n === String(MOST);

  const [snapshot, league, pool, pricing] = await Promise.all([footballNow(), leagueOpinions(), getLeaguePool(), defconPricing()]);
  // A league that prices no DefCon has no DefCon list.
  const lists = LISTS.filter((list) => list.source !== "defcon" || pricing !== null);
  const asked = listFor(query.list, lists);
  const players = snapshot.players.filter(onTheBooks);
  const byCode = playerByCode(snapshot);
  const clubs = clubById(snapshot);

  // Fantrax's points by FPL code, and only for a season played rather than projected; our DefCon points beside them.
  const points = new Map<number, number>();
  const defcon = new Map<number, number>();
  if (!("unavailable" in pool)) {
    const priced = pricing?.(poolPositions(pool.rows));
    for (const row of pool.rows) {
      if (row.fplCode === null) continue;
      const figure = pool.season?.projected === true ? null : (row.stats?.points ?? null);
      if (figure !== null) points.set(row.fplCode, figure);
      const ours = priced?.[row.entry.player.fantraxId] ?? null;
      if (ours !== null) defcon.set(row.fplCode, ours);
    }
  }
  const figures = { rating: seasonRatings(seasonMarks()), points, defcon, stats: intelStats };

  const rowsOf = (list: LeaderList, n: number): Row[] =>
    ranked(leadersOf(list, players, figures), n).map((leader) => {
      const player: FootballPlayer | undefined = byCode.get(leader.code);
      return { ...leader, club: player === undefined ? undefined : clubs.get(player.clubId), href: poolHref(league, leader.code) };
    });

  const picks = lists.map((list) => ({ value: list.key, label: list.title }));

  return (
    <PremShell current="data">
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5 lg:hidden">
        <QuerySelect name="list" label="List" value={asked.key} options={picks} action={DATA} />
      </div>
      <div className="grid items-start gap-2 lg:grid-cols-4">
        {SECTIONS.map((section) => {
          const held = lists.filter((list) => list.section === section.key);
          if (held.length === 0) return null;
          return (
            <section
              key={section.key}
              aria-labelledby={`data-${section.key}`}
              className={`grid items-start gap-2 ${SPAN[held.length]} ${held.includes(asked) ? "" : "max-lg:hidden"}`}
            >
              {/* On a phone the picker above already names the one list it shows. */}
              <h2 id={`data-${section.key}`} className={`${HEADING_PLATE} col-span-full max-lg:sr-only`}>
                {section.title}
              </h2>
              {held.some(({ source }) => typeof source === "object" && "stats" in source) ? (
                <p className={`${MINOR_LABEL} col-span-full px-2`}>Season to {londonDayAndDate(intelStatsManifest.exportedAt)}</p>
              ) : null}
              {held.map((list) => {
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
            </section>
          );
        })}
      </div>
    </PremShell>
  );
}
