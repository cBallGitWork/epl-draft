import Link from "next/link";
import { POOL_GROUPS, type PoolGroupKey } from "./groups";
import { boardHref, chosen } from "./query";
import type { PlayersQuery } from "./query";

// The pieces `BoardBar` arranges: the stat-group strip, the figure chips, the
// badge that counts what is on, and the two shapes they are drawn in.
//
// Split out of `BoardBar.tsx` when the one-row layout took that file past
// CODE_RULES §4's 300-line hard ceiling. The seam is the one the layout already
// implies: `BoardBar` decides WHERE a control goes at a given width, and every
// control here decides what it looks like and what it links to. That is also why
// `Plates` and `Figures` are components rather than fragments inlined twice —
// the row and the drawer render the same element, and a copy in each would be
// two controls that can disagree.

/** Which columns are on the board.
 *
 *  The one strip that stays blue. It picks ONE of a set and marks exactly one
 *  plate current, which is what a Championship Manager tab strip means — and is
 *  why these were never the half of the stack that misread, even sitting in it.
 *
 *  **It does not use `TAB`.** That recipe carries `flex-1` for a strip that
 *  fills its own row, and this one shares a line with a search box and three
 *  other controls — six plates growing into whatever is left would push the
 *  search box to its minimum. It also carries `lg:text-sm`, which is the second
 *  type size this row was trying not to have. What is left of `TAB` once both
 *  are removed is `cm-tab` plus centring, which `PLATE` already does.
 *
 *  **`cm-tab-quiet` and not a `min-h-*`**, which is the fix to Craig's *"we
 *  already have blue bars on this page, do we need them this big?"*. It is a
 *  CLASS because a utility cannot win: `.cm-tab`'s own media rule is 56px above
 *  `lg` and both are one class of specificity, so source order decides and
 *  `desk.css` comes last. `GroupNav` has carried a `lg:min-h-9` that does
 *  nothing since the day it was written — measured on the shipped Team Stats
 *  board, where the plate computes 56px. */
/** Every field the board's URL can carry.
 *
 *  **One list, because two hand-written ones had already drifted into a bug.**
 *  The search form and the club picker are GET forms, and a GET form posts only
 *  its own fields — so each has to render every OTHER field as a hidden input or
 *  using it silently clears the rest of the board. Both listed the fields by
 *  hand, both got the eight obvious ones right, and **both omitted `compare`**.
 *
 *  That is a real bug and not a tidiness point. Every LINK on this board goes
 *  through `href()`, which spreads the whole query and therefore carries
 *  `compare` for free — so tapping a filter chip while picking the second man of
 *  a comparison keeps the first, exactly as `query.ts` promises ("a half-made
 *  comparison survives a filter, a sort and being shared"). Typing in the search
 *  box did not: it dropped him, and the board silently stopped being a picker.
 *
 *  Declared here rather than derived from `PlayersQuery`'s keys, because a type
 *  has no values at runtime and a `Record<keyof PlayersQuery, true>` to stand in
 *  for one is a second list wearing a costume. This one at least fails loudly:
 *  add a field to the query and TypeScript says nothing, but the ONE place to
 *  update is named in the type's docblock. */
const FIELDS = [
  "compare",
  "q",
  "status",
  "pos",
  "sort",
  "dir",
  "all",
  "group",
  "per",
  "club",
  "panel",
  "cat",
] as const;

/** The rest of the query, as hidden inputs, for a GET form to carry.
 *
 *  `except` is the form's OWN field — the one it posts itself, which must not be
 *  rendered twice. */
export function Carried({
  query,
  except,
}: {
  query: PlayersQuery;
  except: readonly (typeof FIELDS)[number][];
}) {
  return (
    <>
      {FIELDS.filter((field) => !except.includes(field)).map((field) =>
        query[field] ? <input key={field} type="hidden" name={field} value={query[field]} /> : null,
      )}
    </>
  );
}

/** **The geometry every control on this row shares.**
 *
 *  Craig, 10 Sep 2026: *"clean up this ui, all buttons different sizes, we can CM
 *  this now"*. He is right and the count says how badly — five kinds of control
 *  sat on one row at four heights and three type sizes: the search field at 44px
 *  and `text-base` with no desk step at all, `SUBMIT` and `BUTTON` at
 *  `text-sm font-medium` in sentence case, the chips at `text-2xs font-bold
 *  uppercase`, and the blue plates at a third height again.
 *
 *  Championship Manager's chrome is uniform — every plate on a screen is the
 *  same object at the same size, which is most of why the game reads as one
 *  machine — and `desk.css` already puts the chrome FACE on all four plate
 *  classes. What it could not do is the geometry, because that is layout and
 *  belongs to the caller (`desk.ts` sets out exactly this split). So the row now
 *  has one recipe and the plates differ only in colour: grey for a thing you
 *  press, blue for a view you are on.
 *
 *  Local to `players/` rather than in `desk.ts`: five sites, all of them here,
 *  and the app-wide `BUTTON`/`SUBMIT`/`SELECT` recipes are shared by nine other
 *  screens that were not asked to change. Promoting it is the day a second board
 *  wants the same row. */
export const PLATE_TYPE =
  "min-h-11 px-2.5 text-2xs font-bold uppercase lg:min-h-9";

/** The same, plus the layout a plate with CONTENT in it needs.
 *
 *  Two recipes because one caller cannot take the layout: a `<select>` is a
 *  replaced element the platform draws, and `display: flex` on one is not a
 *  thing browsers agree about. It needs the height, the padding and the type —
 *  which is what makes it match the plates beside it — and none of the flex. */
export const PLATE =
  `flex shrink-0 items-center justify-center gap-1 whitespace-nowrap ${PLATE_TYPE}`;

/** A plate you press, in its resting state — the grey bevel plus the geometry.
 *
 *  **Three sites, counted 10 Sep 2026**: the `Find` button, the `Filter` link
 *  and an unpressed `Chip`. `QuerySelect`'s `<noscript>` button is a fourth and
 *  differs only in having no hover, which is an oversight rather than a
 *  decision — a plate you can press should light under the pointer whether or
 *  not a script is running. Folded in.
 *
 *  The pressed state is deliberately NOT here: `cm-bevel-pressed` is a different
 *  plate with no hover, because a thing already held down does not lift. */
export const PRESSABLE = `cm-bevel hover:brightness-110 ${PLATE}`;

export function Plates({
  query,
  group,
  className = "flex flex-1 flex-wrap gap-1.5",
}: {
  query: PlayersQuery;
  group: PoolGroupKey;
  /** The strip's layout: a row inline, a grid in the sheet. */
  className?: string;
}) {
  return (
    // **The `<nav>` is the point of the wrapper, not the flex.** It was lost for
    // one build when this became a component and the layout container stayed
    // behind in `BoardBar` — six bare links with no landmark and no label, where
    // "All" and "Scoring" say nothing on their own out of context. It travels
    // with the strip now, so a future move cannot leave it behind again. Found by
    // an instrument looking for the element and getting null.
    <nav aria-label="Stat groups" className={className}>
      {POOL_GROUPS.map((entry) => (
        <Link
          key={entry.key}
          href={boardHref(query, { group: entry.key === "all" ? undefined : entry.key })}
          aria-current={entry.key === group ? "page" : undefined}
          className={`cm-tab cm-tab-quiet ${PLATE}`}
        >
          {entry.label}
        </Link>
      ))}
    </nav>
  );
}

/** How the figures read: one toggle, and it is the only one.
 *
 *  **The minutes floors came off on 10 Sep 2026** (Craig: *"per 90 is just a
 *  toggle, remove the minutes thing"*). They shipped that morning as `90+ mins`
 *  and `135+ mins`, derived from the football played so far, and they were the
 *  most machinery on the board for the least question — two chips, a derivation,
 *  a narrowing and a filter clause, to answer "hide men who barely play" that a
 *  reader answers by looking at the `Min` column. `per90` keeps its own floor of
 *  one match, which is the guard that actually mattered: it is what stops four
 *  minutes and a goal reading as 22.5 per 90, and it is arithmetic rather than a
 *  control.
 *
 *  One chip rather than a component taking a list, now that there is nothing to
 *  list. */
export function Figures({
  query,
  rated,
}: {
  query: PlayersQuery;
  rated: boolean;
}) {
  return (
    <Chip on={rated} href={boardHref(query, { per: rated ? undefined : "90" })}>
      Per 90
    </Chip>
  );
}

/** How many of the board's settings are away from their default, counting only
 *  what this width cannot already see.
 *
 *  Two numbers rather than one, and the difference is the whole point of the
 *  badge: it exists so a SHUT DRAWER cannot hide a filtered board. Above `lg`
 *  the strip and the figure chips are on the row wearing their own pressed
 *  bevels, so counting them again would be the screen saying the same thing
 *  twice — and worse, saying "3" beside three controls a reader can already see
 *  are on.
 *
 *  The SORT is in neither: the table draws its own arrow on its own head, and a
 *  reader who ordered by goals has not filtered anything.
 *
 *  Both counts render, one hidden at each width, for the reason the strip does —
 *  a server component cannot know the viewport, and guessing is worse than
 *  drawing both and letting the cascade choose. */
export function Count({
  query,
  group,
  rated,
}: {
  query: PlayersQuery;
  group: PoolGroupKey;
  rated: boolean;
}) {
  const who =
    chosen(query.status).length + chosen(query.pos).length + (query.club ? 1 : 0);
  const figures = rated ? 1 : 0;
  const columns = group === "all" ? 0 : 1;

  // Three counts, one per step of the row above. Only one is ever visible, and
  // each totals exactly what the drawer still holds at that width.
  return (
    <>
      <Tally at="lg:hidden" total={who + figures + columns} />
      <Tally at="hidden lg:inline xl:hidden" total={who + figures} />
      <Tally at="hidden xl:inline" total={who} />
    </>
  );
}

function Tally({ at, total }: { at: string; total: number }) {
  if (total === 0) return null;
  return <span className={`numeric font-bold ${at}`}>{total}</span>;
}

/** One grey plate, with its state said twice.
 *
 *  **A tick and not the accent, and that is `desk.css`'s rule rather than a
 *  taste.** A plate owns its ink: dark on the grey plate is 7.52:1 and
 *  `--color-ink` on it is 2.27:1, so a component bringing its own colour would
 *  silently land under the floor. An ancestor of this file set `text-accent` on
 *  the pressed plate for one build and `probe.mjs` read the same dark ink off a
 *  pressed chip and an unpressed one. So the pressed bevel carries the state and
 *  a tick carries it again in a SHAPE, which is what docs/rules/PRODUCT.md's accessibility
 *  section asks for.
 *
 *  `min-h-11 lg:min-h-9` is the CONTROL floor and not a row's: a filter is aimed
 *  at rather than read, and DESIGN §6 is explicit that a control never relaxes
 *  below its floor under a thumb. */
export function Chip({ on, href, children }: { on: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      // A chip changes the view in place; the page must not jump to the top under the thumb.
      scroll={false}
      aria-pressed={on}
      className={on ? `cm-bevel-pressed ${PLATE}` : PRESSABLE}
    >
      {/* `aria-hidden` because `aria-pressed` on the link already says it, and a
          screen reader announcing "tick DEF pressed" says it twice. */}
      {on ? (
        <span aria-hidden className="text-[0.625rem] leading-none">
          ✓
        </span>
      ) : null}
      {children}
    </Link>
  );
}
