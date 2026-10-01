import Link from "next/link";
import { sortableIn, type PoolGroupKey } from "./groups";
import { activeSort, boardHref, filterHref, isChosen } from "./query";
import { POOL } from "./routes";
import Search from "./Search";
import type { PlayersQuery } from "./query";
import { positionLabel } from "../positions";
import { LABEL, PANEL, SECTION_BAR, SMALL_CAPS } from "@/app/desk";
import { Carried, clubOptions, Count, Figures, PRESSABLE, Plates, Statuses } from "./BoardControls";
import QuerySelect from "./QuerySelect";

// Every control on the board: one row on the desk (search, the stat groups from `lg`, Per 90 from `xl`, Filter),
// and under a thumb the row plus a sheet docked over the thumb rail. The sheet is URL state (`?panel=1`), so a
// filtered board can be shared, and the stat groups render in both places with only one ever shown.

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
      {/* **What sits on the row grows with the width, in two steps**, and that
          is measured rather than chosen. The first cut put the strip and both
          figure chips inline from `lg`, and at 1024 the row broke in the two
          ways a flex row breaks: the search box — `flex-1` with `min-w-0` —
          shrank to a 40px slot with no room for a word, and the `Filter` plate
          wrapped to a second line on its own. A desk of 1024 has about 870px
          inside the rail and the panel, and the full set wants 920.

          So `lg` takes the stat groups, which are the most frequent tap, and
          `2xl` adds the figure chips. Whatever is not on the row is in the
          drawer at that width, so nothing is ever unreachable — and the search
          box takes a FIXED width from `lg` rather than a flexible one, because
          the thing that must never collapse cannot be the thing that absorbs
          the slack.

          **Both steps are measured, and the second moved after it was.** The row
          and its children, read off the rendered page at five widths on 10 Sep
          2026:

            1024   row 842   form 176 + plates 579 + filter 75 = 830
            1280   row 1098  …with the figure chips, 1136. Over.
            1440   row 1100  the same, and the frame is capped — 1440 is barely
                             wider than 1280 inside the rail
            1536   row 1354  1152. Fits, and it is where `globals.css` grows the
                             frame to 96rem
            1800   row 1484

          `xl` was the first guess and it is wrong by 36px: the plate strip is
          `flex-1`, so instead of overflowing it quietly took 525 of the 579 it
          needs and wrapped `Market` onto a line of its own. A row that fits
          because one of its children folded is not a row that fits. */}
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
          {/* Who he belongs to, on the row under a thumb (Craig, 1 Oct 2026: "mobile can have owned button show
              by default"); the sheet carries it on a desk. */}
          <Statuses query={query} counted={counted} className="flex lg:hidden" />
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

            <Block label="Status" className="max-lg:hidden">
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
        {positionLabel(position) ?? position}
      </span>
    </Link>
  );
}
