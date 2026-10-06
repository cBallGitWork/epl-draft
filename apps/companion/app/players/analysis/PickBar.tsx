import Link from "next/link";
import PickField from "./PickField";
import { candidates } from "./pick";
import type { Candidate } from "./pick";
import type { PoolRow } from "../pool";
import { ANALYSIS } from "../routes";
import { ROW_NAME } from "../../desk";
import { ROW_LINK } from "../../components/league/TableCells";

// Choosing both men without leaving the screen (Craig, 10 Sep 2026): a box over each half, naming the man it would
// replace. The board's picker stays as the way in from a player's page.

/** One side's state as the page read it. */
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
  /** The pool, already cached for the board: nothing here costs Fantrax a call. */
  rows: readonly PoolRow[];
  a: Side;
  b: Side;
}) {
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
        {/* Everything the form does not own, so searching for one man cannot forget the other. */}
        <Carried name="a" value={side === "a" ? mine.chosen : other.chosen} />
        <Carried name="b" value={side === "b" ? mine.chosen : other.chosen} />
        <Carried name={side === "a" ? "qb" : "qa"} value={other.typed} />
      </PickField>
      <Found side={side} mine={mine} other={other} found={found} />
    </div>
  );
}

/** What the box found, as links that swap this side and leave the other alone; a search that matches nobody says so. */
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
    // Set as every tappable name in the app is, since a phone has no hover to say so.
    <ul className="cm-rows flex flex-col">
      {found.map((man) => (
        <li key={man.fantraxId}>
          <Link
            href={pickHref(side, man.fantraxId, other)}
            // Holds its place: the list collapses on the pick (Craig, 10 Sep 2026: "its annoying").
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

/** Where picking a name goes: this side becomes him and its search is spent; the other side, and its search, are kept. */
function pickHref(side: "a" | "b", fantraxId: string, other: Side): string {
  const next = new URLSearchParams();
  next.set(side, fantraxId);
  if (other.chosen !== undefined) next.set(side === "a" ? "b" : "a", other.chosen);
  if (other.typed.trim() !== "") next.set(side === "a" ? "qb" : "qa", other.typed.trim());
  return `${ANALYSIS}?${next.toString()}`;
}

/** One field of the query the form does not own, or nothing: an empty one would post `a=`, an id of "". */
function Carried({ name, value }: { name: string; value: string | undefined }) {
  if (value === undefined || value.trim() === "") return null;
  return <input type="hidden" name={name} value={value} />;
}
