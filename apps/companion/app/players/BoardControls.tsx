import Link from "next/link";
import { POOL_GROUPS, type PoolGroupKey } from "./groups";
import { boardHref, chosen, filterHref, isChosen } from "./query";
import type { QueryOption } from "./QuerySelect";
import type { PlayersQuery } from "./query";
import { STATUS, STATUS_CHIP } from "./status";
import { SMALL_CAPS } from "@/app/desk";

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

/** Every field the board's URL can carry: a GET form posts only its own fields, so each renders the rest hidden
 *  (`Carried`) or using it clears the board. One list, because two had drifted and dropped `compare`. */
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

/** The geometry every control on this row shares (Craig, 10 Sep 2026: *"all buttons different sizes, we can CM
 *  this now"*): one recipe, the plates differing only in colour. Two pixels tighter a side under a thumb, so the
 *  status chips, Filter and the search share a 390 phone's row. Local to `players/`, where all its sites are. */
export const PLATE_TYPE =
  `min-h-11 px-2 ${SMALL_CAPS} lg:min-h-9 lg:px-2.5`;

/** The same, plus the layout a plate with CONTENT in it needs.
 *
 *  Two recipes because one caller cannot take the layout: a `<select>` is a
 *  replaced element the platform draws, and `display: flex` on one is not a
 *  thing browsers agree about. It needs the height, the padding and the type —
 *  which is what makes it match the plates beside it — and none of the flex. */
export const PLATE =
  `flex shrink-0 items-center justify-center gap-1 whitespace-nowrap ${PLATE_TYPE}`;

/** A plate you press, at rest: the `Filter` link, an unpressed `Chip`, `QuerySelect`'s `<noscript>` button and the
 *  pick field's. Not the pressed state: `cm-bevel-pressed` is a plate with no hover, because a held thing does not lift. */
export const PRESSABLE = `cm-bevel hover:brightness-110 ${PLATE}`;

/** Which columns are on the board: the one strip that stays blue, at the control floor (`cm-tab-quiet`). */
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

/** Who he belongs to, one chip per Fantrax status the pool carries: its code on the chip, its word and count in the
 *  title. */
export function Statuses({
  query,
  counted,
  className,
}: {
  query: PlayersQuery;
  counted: ReadonlyMap<string, number>;
  /** Where the group shows: the row and the drawer each carry it at the widths the other does not. */
  className: string;
}) {
  return (
    <div role="group" aria-label="Status" className={`gap-1.5 ${className}`}>
      {[...counted.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, tally]) => (
          <Chip
            key={code}
            on={isChosen(query, "status", code)}
            href={filterHref(query, "status", code)}
            title={`${STATUS[code] ?? code}: ${tally}`}
          >
            {STATUS_CHIP[code] ?? code}
          </Chip>
        ))}
    </div>
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

/** How many of the board's settings are away from their default, counting only what this width cannot already see:
 *  it exists so a shut drawer cannot hide a filtered board. The sort is never counted; the table's head says it.
 *  One count per step of the row, each hidden at the others, because a server component cannot know the viewport. */
export function Count({
  query,
  group,
  rated,
}: {
  query: PlayersQuery;
  group: PoolGroupKey;
  rated: boolean;
}) {
  const status = chosen(query.status).length;
  const who = chosen(query.pos).length + (query.club ? 1 : 0);
  const figures = rated ? 1 : 0;
  const columns = group === "all" ? 0 : 1;
  return (
    <>
      <Tally at="lg:hidden" total={who + figures + columns} />
      <Tally at="hidden lg:inline xl:hidden" total={status + who + figures} />
      <Tally at="hidden xl:inline" total={status + who} />
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
export function Chip({
  on,
  href,
  title,
  children,
}: {
  on: boolean;
  href: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      // A chip changes the view in place; the page must not jump to the top under the thumb.
      scroll={false}
      aria-pressed={on}
      title={title}
      className={`min-w-11 ${on ? `cm-bevel-pressed ${PLATE}` : PRESSABLE}`}
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

/** The club select's options: every club, then each by its code. */
export function clubOptions(codes: readonly string[]): QueryOption[] {
  return [{ value: "", label: "All clubs" }, ...codes.map((code) => ({ value: code, label: code }))];
}
