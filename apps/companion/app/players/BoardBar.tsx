import Link from "next/link";
import type { PoolGroupKey } from "./groups";
import { boardHref, chosen, filterHref, isChosen } from "./query";
import { POOL } from "./routes";
import Search from "./Search";
import type { PlayersQuery } from "./query";
import { STATUS } from "./status";
import { positionLabel } from "../positions";
import { PANEL_FLUSH } from "@/app/desk";
import { Carried, Chip, Count, Figures, PRESSABLE, Plates } from "./BoardControls";
import ClubPicker from "./ClubPicker";

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
          <Carried query={query} except="q" />
        </Search>

        <div className="hidden flex-1 lg:block">{plates}</div>
        <div className="hidden xl:flex xl:gap-1.5">{figures}</div>

        <Link
          href={boardHref(query, { panel: open ? undefined : "1" })}
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
        // **One row, and no headings on it** (Craig, 10 Sep 2026: *"get this
        // onto one row… remove figures/who"*). The drawer shipped that morning
        // as three labelled bands, which was the right cure for a field of
        // eleven chips doing three unrelated jobs — and then two of the three
        // jobs left it. The stat groups went up to the row above at `lg`, the
        // minutes floors were deleted outright, and what remains is one toggle
        // and a set of filters that name themselves: `Per 90`, `Free agent`,
        // `GK`. A heading over a chip that already says what it is is furniture,
        // and three headings over nine chips was most of the drawer's height.
        //
        // `PANEL_FLUSH` rather than `PANEL`: a well holding ONE thing that
        // manages its own spacing, which is exactly what this is now — `PANEL`'s
        // column gap has nothing left to sit between.
        <div className={`${PANEL_FLUSH} p-2`}>
          <div className="flex flex-wrap gap-1.5">
            {/* Below `xl` only: above it the toggle is on the row above, and a
                control in two visible places is a control that can disagree with
                itself. */}
            <span className="contents xl:hidden">{figures}</span>

            {/* **`All` is pressed by default** (Craig: *"WHO needs an ALL option
                thats selected by default"*). Without it the band had no lit
                plate in its resting state, so the row of controls that is
                usually off looked unset rather than deliberate — and clearing
                several filters meant tapping each one off in turn and
                remembering which.

                It is the only chip here that is not a toggle: it drops both
                lists at once and cannot be turned off, because turning "all of
                them" off is not a state. Pressed exactly when nothing else is,
                so the row always has precisely one answer showing. */}
            <Chip
              on={chosen(query.status).length === 0 && chosen(query.pos).length === 0}
              href={boardHref(query, { status: undefined, pos: undefined })}
            >
              All
            </Chip>

            {[...counted.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, tally]) => (
                <Chip
                  key={code}
                  on={isChosen(query, "status", code)}
                  href={filterHref(query, "status", code)}
                >
                  {STATUS[code] ?? code}
                  <span className="numeric font-normal">{tally}</span>
                </Chip>
              ))}

            {positions.map((position) => (
              <Chip
                key={position}
                on={isChosen(query, "pos", position)}
                href={filterHref(query, "pos", position)}
              >
                {positionLabel(position) ?? position}
              </Chip>
            ))}

            {/* **Last on the row, and a `<select>` rather than chips.** Twenty
                clubs is a wall of plates that would take this drawer straight
                back to the wrapped rows it was collapsed out of, and it would
                give the least-used filter the most space. Its hidden fields are
                rendered here on the server for the reason `Search`'s are. */}
            <ClubPicker clubs={clubs} club={query.club ?? ""} action={POOL}>
              <Carried query={query} except="club" />
            </ClubPicker>
          </div>
        </div>
      ) : null}
    </>
  );
}
