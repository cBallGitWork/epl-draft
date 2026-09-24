import Link from "next/link";
import PickField from "./PickField";
import { candidates } from "./pick";
import type { Candidate } from "./pick";
import type { PoolRow } from "../pool";
import { ANALYSIS } from "../routes";
import { ROW_NAME } from "../../desk";
import { ROW_LINK } from "../../components/league/TableCells";

// Choosing both men without leaving the screen.
//
// Craig, 10 Sep 2026: *"we need to compare players without leaving this screen,
// so we need search bars"*. Until now the only way to change either man was the
// board — `/players?compare=<id>` turned the directory into a picker and every
// row's link changed destination — so swapping one of two players meant leaving
// the comparison, finding a name among six hundred, and coming back. Understat's
// compare, the reference Craig sent, puts a search box on the screen itself and
// that is the whole of what this is.
//
// **Two boxes and not one**, because the question "who am I comparing him to" is
// asked far more often than "who am I comparing", and a single box would need a
// mode. Each names the man it would replace, so the screen says what a tap does
// before it is tapped.
//
// **The board's picker stays.** It is the way in from a player's own page —
// "Compare with…" — and this is the way to change your mind once you are here.
// Two routes to the same pair, and neither is the other's fallback.

/** One side's state as the page read it. Not exported: `page.tsx` passes a
 *  literal and structural typing checks it. */
interface Side {
  /** The man on this side now, or undefined before either is chosen. */
  chosen: string | undefined;
  /** What is in this side's box. */
  typed: string;
  /** Who this side is now, for the box's accessible name; the bar under the boxes prints it. */
  name: string | null;
}

export default function PickBar({
  rows,
  a,
  b,
}: {
  /** The pool, already read and cached for the board. Nothing here costs Fantrax
   *  a call — see `pick.ts` on why that is the binding constraint. */
  rows: readonly PoolRow[];
  a: Side;
  b: Side;
}) {
  // **No section head.** It wore one saying "Choose" over "Either side, any
  // player in the pool", and Craig took both off (10 Sep 2026). They were
  // furniture: two labelled fields with a Find button beside each say what they
  // are, and the heading was a third telling of a thing the screen had already
  // said twice.
  return (
    // One row at every width, each box over the half of the bar it would change (Craig, 24 Sep 2026).
    <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
      <Box side="a" mine={a} other={b} rows={rows} />
      <Box side="b" mine={b} other={a} rows={rows} />
    </div>
  );
}

/** One side: what it is called, its box, and what the box found. */
function Box({
  side,
  mine,
  other,
  rows,
}: {
  side: "a" | "b";
  mine: Side;
  other: Side;
  rows: readonly PoolRow[];
}) {
  const found = candidates(rows, mine.typed, other.chosen);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <PickField
        side={side}
        query={mine.typed}
        action={ANALYSIS}
        placeholder="Name…"
        label={mine.name ? `Swap ${mine.name} for another player` : side === "a" ? "Find a player" : "Find a player to compare"}
      >
        {/* Everything the form does not own, so searching for one man cannot
            forget the other. `PickField`'s debounced navigation reads these back
            out of the form, so both ways out preserve the same state. */}
        <Carried name="a" value={side === "a" ? mine.chosen : other.chosen} />
        <Carried name="b" value={side === "b" ? mine.chosen : other.chosen} />
        <Carried name={side === "a" ? "qb" : "qa"} value={other.typed} />
      </PickField>
      <Found side={side} mine={mine} other={other} found={found} />
    </div>
  );
}

/** What the box found, as links that swap this side and leave the other alone.
 *
 *  **A typed search that matches nobody says so.** Silence after typing reads as
 *  a control that has stopped working; the pool has 88 names FPL never listed
 *  and a fair few a reader will spell the other way, so "no match" is a real
 *  answer this screen will give often. */
function Found({
  side,
  mine,
  other,
  found,
}: {
  side: "a" | "b";
  mine: Side;
  other: Side;
  found: Candidate[];
}) {
  if (mine.typed.trim() === "") return null;

  if (found.length === 0) {
    return <p className="text-2xs text-faint">No player of that name in the pool.</p>;
  }

  return (
    // `cm-rows` for the rule between them and `ROW_LINK`/`ROW_NAME` for the row
    // itself, so a name here looks exactly like every other tappable name in the
    // app rather than inventing an affordance for one control. That matters more
    // on a phone than on the desk: there is no hover to reveal, so the only
    // thing saying "this is a target" is that it is set like one.
    <ul className="cm-rows flex flex-col">
      {found.map((man) => (
        <li key={man.fantraxId}>
          <Link
            href={pickHref(side, man.fantraxId, other)}
            // **`scroll={false}`, like the map picker** (Craig, 10 Sep 2026:
            // *"its annoying"*, of picking a player doing it). It was left on at
            // first on the reasoning that choosing a man changes the whole
            // SUBJECT of the screen, where choosing a map changes one panel —
            // and the reasoning was sound and the answer still wrong. The
            // result list collapses the moment you pick, so the page shortens
            // under the tap and the jump lands somewhere the reader did not
            // ask for. Every navigation on this screen now holds its place;
            // the tab strip out of it does not, which is correct — that one
            // really is a link to somewhere else.
            scroll={false}
            className={`${ROW_LINK} px-1.5`}
          >
            <span className={`${ROW_NAME} min-w-0 truncate`}>{man.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Where picking a name goes: this side becomes him, the other side is untouched,
 *  and THIS side's search is spent. The other side's is kept — a reader mid-way
 *  through choosing both should not lose half the work by finishing the first
 *  half. */
function pickHref(side: "a" | "b", fantraxId: string, other: Side): string {
  const next = new URLSearchParams();
  next.set(side, fantraxId);
  if (other.chosen !== undefined) next.set(side === "a" ? "b" : "a", other.chosen);
  if (other.typed.trim() !== "") next.set(side === "a" ? "qb" : "qa", other.typed.trim());
  return `${ANALYSIS}?${next.toString()}`;
}

/** One field of the query the form does not own, or nothing at all.
 *
 *  An empty hidden input is not the same as an absent one: it posts `a=` and
 *  turns "no man chosen" into "a man whose id is the empty string", which the
 *  page would then try to look up. */
function Carried({ name, value }: { name: string; value: string | undefined }) {
  if (value === undefined || value.trim() === "") return null;
  return <input type="hidden" name={name} value={value} />;
}
