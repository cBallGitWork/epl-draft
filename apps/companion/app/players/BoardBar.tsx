import Link from "next/link";
import { sortableIn, type PoolGroupKey } from "./groups";
import { activeSort, boardHref, filterHref, isChosen } from "./query";
import { POOL } from "./routes";
import Search from "./Search";
import type { PlayersQuery } from "./query";
import { leaguePositionLabel } from "../positions";
import { LABEL, PANEL, SECTION_BAR, SMALL_CAPS } from "@/app/desk";
import { Carried, clubOptions, Count, Figures, PRESSABLE, Plates, Statuses } from "./BoardControls";
import QuerySelect from "../components/shell/QuerySelect";

// Every control on the board: one row on the desk (search, the stat groups from `lg`, status and Per 90 from `xl`,
// Filter), and under a thumb the row plus a sheet docked over the thumb rail. The sheet is URL state (`?panel=1`), so
// a filtered board can be shared; a control the row carries at a width is the one the sheet leaves out there.

export default function BoardBar({
  query,
  group,
  positions,
  clubs,
  counted,
  rated,
  shown,
  scored,
}: {
  query: PlayersQuery;
  group: PoolGroupKey;
  /** The league's own position vocabulary, in pitch order. */
  positions: readonly string[];
  /** Every club with a player in the pool, in the order they are offered. */
  clubs: readonly string[];
  /** How many of the pool are in each Fantrax status, for the chip's figure. */
  counted: Map<string, number>;
  rated: boolean;
  /** How many rows the filters leave, for the sheet's way back to the board. */
  shown: number;
  /** Every column the league's stat read carries, so the sort offers no count it does not score. */
  scored: ReadonlySet<string>;
}) {
  const open = query.panel === "1";
  const plates = <Plates query={query} group={group} />;
  const figures = <Figures query={query} rated={rated} />;

  return (
    <>
      {/* The row grows with the width in measured steps (PLATFORM_NOTES): a row that fits by folding a child does not fit. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* The hidden fields are rendered HERE, on the server, and handed to
            the client box as children — `panel` among them, so finding a player
            does not slam a drawer the reader deliberately left open. */}
        <Search query={(query.q ?? "").trim()} action={POOL}>
          <Carried query={query} except={["q"]} />
        </Search>

        <div className="hidden flex-1 lg:block">{plates}</div>

        {/* One cluster, so under a thumb the chips and Filter take a second line together when the search needs it. */}
        <div className="ml-auto flex gap-1.5">
          {/* Who he belongs to (Craig, 1 Oct 2026: "on desktop have ww/fa filter in view", "mobile can have owned
              button show by default"); between `lg` and `xl` the row has no room and the sheet carries it. */}
          <Statuses query={query} counted={counted} className="flex lg:max-xl:hidden" />
          <div className="hidden xl:flex">{figures}</div>
          <Link
            href={boardHref(query, { panel: open ? undefined : "1" })}
            scroll={false}
            aria-expanded={open}
            className={PRESSABLE}
          >
            Filter
            {/* What the drawer holds that is on, so a shut drawer cannot hide a filtered board. */}
            <Count query={query} group={group} rated={rated} />
            <span aria-hidden>{open ? "▾" : "▸"}</span>
          </Link>
        </div>
      </div>

      {open ? (
        <>
          {/* A phone's sheet sits over the page, and a tap outside it closes it. */}
          <Link
            href={boardHref(query, { panel: undefined })}
            scroll={false}
            aria-label="Close the filters"
            className="fixed inset-0 z-40 bg-bg/70 lg:hidden"
          />
          <div role="dialog" aria-label="Filter players" className={`${PANEL} cm-sheet`}>
            <p className={SECTION_BAR}>Filter players</p>

            <Block label="Position">
              <div className="grid grid-cols-4 gap-1.5">
                {positions.map((position) => (
                  <PositionChoice key={position} query={query} position={position} />
                ))}
              </div>
            </Block>

            <Block label="Status" className="max-lg:hidden xl:hidden">
              <Statuses query={query} counted={counted} className="flex flex-wrap" />
            </Block>

            <div className="grid grid-cols-2 gap-1.5">
              <Block label="Club">
                <QuerySelect
                  name="club"
                  label="Club"
                  value={query.club ?? ""}
                  options={clubOptions(clubs)}
                  action={POOL}
                >
                  <Carried query={query} except={["club"]} />
                </QuerySelect>
              </Block>
              <Block label="Sort by">
                <QuerySelect
                  name="sort"
                  label="Sort by"
                  value={activeSort(query).key}
                  options={sortableIn(scored).map((c) => ({ value: c.key, label: c.label }))}
                  action={POOL}
                >
                  <Carried query={query} except={["sort", "dir"]} />
                </QuerySelect>
              </Block>
            </div>

            {/* The row above carries these on a desk; below it they are only here. */}
            <Block label="Columns" className="lg:hidden">
              <Plates query={query} group={group} className="grid grid-cols-3 gap-1.5" />
            </Block>
            <div className="flex xl:hidden">{figures}</div>

            <div className="grid grid-cols-[1fr_2fr] gap-1.5 border-t border-line pt-2">
              <Link
                href={boardHref(query, { pos: undefined, status: undefined, club: undefined, group: undefined, per: undefined })}
                scroll={false}
                className={PRESSABLE}
              >
                Reset
              </Link>
              <Link href={boardHref(query, { panel: undefined })} scroll={false} className={PRESSABLE}>
                Show {shown} <span aria-hidden>▸</span>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

/** A labelled block in the sheet: CM's settings form, a word over each kind of control (`cm9900/03.jpg`). */
function Block({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className={LABEL}>{label}</p>
      {children}
    </div>
  );
}

/** A position as CM's index tile. Chosen, it keeps its white word and gains an accent edge and a tick,
 *  because the accent on the tile's ramp is 3.7:1 at its light top. */
function PositionChoice({ query, position }: { query: PlayersQuery; position: string }) {
  const on = isChosen(query, "pos", position);
  return (
    <Link
      href={filterHref(query, "pos", position)}
      scroll={false}
      aria-pressed={on}
      className={`cm-index grid min-h-11 place-items-center px-1 ${SMALL_CAPS} lg:min-h-9`}
    >
      <span>
        {on ? <span aria-hidden>✓ </span> : null}
        {leaguePositionLabel(position)}
      </span>
    </Link>
  );
}
