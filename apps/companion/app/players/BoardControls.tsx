import Link from "@/app/components/shell/Link";
import { POOL_GROUPS, type PoolGroupKey } from "./groups";
import { boardHref, chosen, filterHref, isChosen } from "./query";
import type { QueryOption } from "../components/shell/QuerySelect";
import type { PlayersQuery } from "./query";
import { STATUS, STATUS_CHIP } from "./status";
import { SMALL_CAPS, heldPlate } from "@/app/desk";

// The pieces `BoardBar` arranges: the stat-group strip, the status chips, the figure chip, the badge that counts
// what is on, and the shapes they are drawn in. `BoardBar` decides where a control goes at a width; each here decides
// what it looks like and links to, so the row and the sheet render one element rather than two that can disagree.

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

/** The rest of the query as hidden inputs for a GET form; `except` is the form's own field. */
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
const PLATE =
  `flex shrink-0 items-center justify-center gap-1 whitespace-nowrap min-h-11 px-2 ${SMALL_CAPS} lg:min-h-9 lg:px-2.5`;

/** A plate you press, at rest: the `Filter` link, an unpressed `Chip` and the pick field's button. */
export const PRESSABLE = `${heldPlate(false)} ${PLATE}`;

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
    // The `<nav>` is the landmark that names the strip; it travels with it.
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

/** The per-90 toggle (Craig, 10 Sep 2026: "per 90 is just a toggle"); `per90` keeps its own one-match floor. */
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
      <Tally at="hidden xl:inline" total={who} />
    </>
  );
}

function Tally({ at, total }: { at: string; total: number }) {
  if (total === 0) return null;
  return <span className={`numeric font-bold ${at}`}>{total}</span>;
}

/** One grey plate, its state said by the pressed bevel and a tick: the plate owns its ink, so never the accent. */
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
      className={`min-w-11 ${heldPlate(on)} ${PLATE}`}
    >
      {/* `aria-pressed` already says it to a screen reader. */}
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
