import Link from "next/link";
import type { PoolGroupKey } from "./groups";
import { activeSort, boardHref, filterHref, isChosen } from "./query";
import { POOL } from "./routes";
import Search from "./Search";
import type { PlayersQuery } from "./query";
import { STATUS } from "./status";
import { positionLabel } from "../positions";
import { LABEL, PANEL, SECTION_BAR } from "@/app/desk";
import { Carried, Chip, Count, Figures, PRESSABLE, Plates } from "./BoardControls";
import ClubPicker from "./ClubPicker";
import SortPicker from "./SortPicker";

// Every control on the board: **one row on the desk, one row and a drawer under
// a thumb.**
//
// Two complaints got it here, and they are different complaints.
//
// **First, Craig, 10 Sep 2026: *"when i said messy, i meant essentially three
// rows of column headers"*.** The board had a blue stat-group strip, a grey
// field of eleven filter chips, and then the table's own grey head strip — and
// the middle two wear THE SAME BEVEL. `cm-bevel` means "something you press",
// which a chip and a column head both are, so three consecutive full-width rows
// of small bold capitals read as three header rows stacked and a reader cannot
// tell which of them belongs to the table. It was never the NUMBER of controls;
// it was that a control and a column head are the same object in this
// vocabulary. Worth remembering before adding a fourth bevelled row anywhere on
// the desk.
//
// **Second, and it corrected the fix: *"i think we can get most things onto one
// row though"*, against Opta's desktop shot.** The first answer put everything
// behind the `Filter` plate, which cured the stacking and threw away the desk's
// width with it — their grid runs search, stat-group tabs, `PER 90` and
// `MIN MINUTES` across a single line and keeps only the position and team
// pickers in the drawer. A desk is wide. Using it is free, and it makes the most
// frequent action — changing the stat group — one tap rather than two.
//
// So the row holds what a reader changes often and the drawer holds the long
// tail. Nothing above the head strip is a full-width bar of bevelled capitals
// any more, which is what the first complaint was actually about.
//
// **The strip and the figures are written once and rendered twice**, inline
// above `lg` and inside the drawer below it. Only ever one of the two is in the
// tree — `hidden` removes an element from the accessibility tree as well as from
// the page — which is the same rule `desk.ts`'s `DESK_ONLY` already applies to a
// column that stands down. The alternative is a phone whose first control row
// scrolls sideways past six plates before reaching the search box.
//
// **The drawer opens through the URL rather than through React state.** Every
// other control on this page is a link, and that is what lets a filtered board
// be shared, bookmarked and read with no JavaScript at all — `query.ts` records
// the same reasoning for choosing chips over the reference's slider. A
// `useState` drawer would make the one control that reveals the others the only
// one needing a script. `?panel=1` costs a round trip Next prefetches, and it
// means "the board with the filters open" is a thing you can send somebody.

export default function BoardBar({
  query,
  group,
  positions,
  clubs,
  counted,
  rated,
  shown,
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
        <div className="hidden xl:flex xl:gap-1.5">{figures}</div>

        <Link
          href={boardHref(query, { panel: open ? undefined : "1" })}
          scroll={false}
          aria-expanded={open}
          className={PRESSABLE}
        >
          Filter
          {/* **The count, so a shut drawer cannot hide a filtered board.** A
              reader landing on a shared link with three filters on and the panel
              closed would otherwise see six hundred names cut to forty with
              nothing on screen saying why. `aria-expanded` says how the drawer
              is; this says how the board is. Above `lg` the strip and the chips
              are on the row saying it themselves, so only what the drawer still
              holds is counted there. */}
          <Count query={query} group={group} rated={rated} />
          <span aria-hidden>{open ? "▾" : "▸"}</span>
        </Link>
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

            <Block label="Status">
              <div className="flex flex-wrap gap-1.5">
                {[...counted.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, tally]) => (
                    <Chip key={code} on={isChosen(query, "status", code)} href={filterHref(query, "status", code)}>
                      {STATUS[code] ?? code}
                      <span className="numeric font-normal">{tally}</span>
                    </Chip>
                  ))}
              </div>
            </Block>

            <div className="grid grid-cols-2 gap-1.5">
              <Block label="Club">
                <ClubPicker clubs={clubs} club={query.club ?? ""} action={POOL}>
                  <Carried query={query} except={["club"]} />
                </ClubPicker>
              </Block>
              <Block label="Sort by">
                <SortPicker sort={activeSort(query).key} action={POOL}>
                  <Carried query={query} except={["sort", "dir"]} />
                </SortPicker>
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
      className="cm-index grid min-h-11 place-items-center px-1 text-2xs font-bold uppercase lg:min-h-9"
    >
      <span>
        {on ? <span aria-hidden>✓ </span> : null}
        {positionLabel(position) ?? position}
      </span>
    </Link>
  );
}
