import type { SortKey } from "@epl/core";
import { sortHref } from "./sort";
import { Head, HeadRow, NameHead, PLATE, SortHead, sortedAs } from "../components/league/TableHeads";
import { TEXT, standDown } from "@/app/desk";

// The table's column heads, in one place because two files print them: the page
// and the skeleton it waits behind. They were written out twice, and on 29 Aug
// only one of the two copies stopped saying W-L-T — so a reader saw the old
// heading over the new numbers for as long as Fantrax took to answer.
//
// **Bevelled buttons, which is the thing CM tables are remembered for.** They
// were flat until Craig looked at the first attempt and said it looked nothing
// like the game, and he was right: the bevel is not decoration on a CM table, it
// is what a CM table IS. It is drawn as a button because it behaves as one — the
// sorted column is drawn pressed, so the affordance and the state are one object.
//
// The name cell carries no plate and no word: CM's strip is a ruler over the
// FIGURES and starts at the first of them (`cm9900/24.jpg`), and a column of
// names with a crest on each has never needed telling apart from one. Sorting by
// name is not offered either, because a league table is not read alphabetically.
//
// *This paragraph said the Team head "keeps the bevel and is not a link" until
// 10 Sep 2026. Half of it was never true — `NameHead` has drawn a bare cell
// since it was extracted — and the reasoning it gave for the bevel was doing the
// work of explaining why the cell has no hover and no href. It still hasn't.*

type Column = {
  key: SortKey | "team" | "form";
  label: string;
  title: string | undefined;
  align: "left" | "center" | "right";
  width: string;
  /** A column the phone does without, so the last one — the column the table is
   *  FOR — fits at 390 without a sideways scroll. */
  deskOnly?: true;
  /** A column whose head is blank because the column names itself. The label is
   *  still written, and still reaches a screen reader — `TableHeads.MUTE`
   *  carries the argument. */
  mute?: true;
};

/** One column, and the list is what `colSpan` counts — a rule drawn across the
 *  table needs to know how wide the table is, and a literal 8 here is a number
 *  that goes wrong the day a column is added. It went from eight to ten on
 *  31 Aug 2026, which is the day that mattered. Below `lg` two of the ten are
 *  `display: none` and the rule spans them at zero width, which is harmless and
 *  measured — a `colSpan` of the visible count would need the width the server
 *  does not have.
 *
 *  **A football league table, which is what `cm9900/24.jpg` prints.** Its header
 *  reads `Pld Won Drn Lst For Ag Pts` and so does every table in an English
 *  newspaper; this is that row, plus the form guide a modern one carries.
 *
 *  What went, and why each was a Fantrax habit rather than a column:
 *
 *  · **`W-D-L`** was three numbers crushed into one cell. A football table gives
 *    each its own column, and a combined cell can only ever be sorted by one of
 *    the three — this one silently sorted by wins under a head that named all
 *    three.
 *  · **`GB`** — games back, half a game per win the leader is ahead. A baseball
 *    convention, in a sport with draws in it, in a league paying three for a win.
 *    It was also the only column the standings PAGE does not publish, so losing
 *    it took a second provider read out of `/league` and out of the edition
 *    writer with it.
 *  · **`Win%`** — a baseball-style proportion set `.500`, which is not a
 *    percentage, needed a paragraph to explain, and says less than `W D L` says
 *    in three narrower columns.
 *
 *  And `FP` became `For`. It is the same number; a league table calls what you
 *  scored `For`, and the Fantrax abbreviation was the last of the vocabulary.
 *
 *  **Two of the ten heads print nothing** — the placing and the name, which are
 *  the two columns that label themselves. `TableHeads.MUTE` carries Craig's call
 *  and the reason the words are still written down. */
export const COLUMNS: readonly Column[] = [
  { key: "rank", label: "Placing", title: "Fantrax's own order", align: "center", width: "w-8 lg:w-14", mute: true },
  { key: "team", label: "Team", title: undefined, align: "left", width: "" },
  { key: "played", label: "Pld", title: "Played — won, drawn and lost added up", align: "center", width: "w-8 lg:w-20" },
  { key: "won", label: "W", title: "Won", align: "center", width: "w-7 lg:w-16" },
  { key: "drawn", label: "D", title: "Drawn", align: "center", width: "w-7 lg:w-16" },
  { key: "lost", label: "L", title: "Lost", align: "center", width: "w-7 lg:w-16" },
  { key: "for", label: "For", title: "Fantasy points scored — Fantrax's FPtsF", align: "center", width: "w-11 lg:w-24" },
  { key: "against", label: "Ag", title: "Fantasy points conceded — Fantrax's FPtsA", align: "center", width: "w-11 lg:w-24", deskOnly: true },
  { key: "pts", label: "Pts", title: "League points — the commissioner's own, never counted here", align: "center", width: "w-10 lg:w-24" },
  { key: "form", label: "Form", title: "The last five rounds, oldest first", align: "center", width: "w-14 lg:w-32", deskOnly: true },
];

/** Where a column's content sits, as a flex class and as a text class.
 *
 *  **Centred, which is what `cm9900/24.jpg` does** (Craig, 31 Aug). Every figure
 *  in the game's table is centred under a centred head, and ours were flushed
 *  right — a spreadsheet habit that reads as one. It matters most now that the
 *  columns are narrow: `W` `D` `L` are one digit each, and a single digit jammed
 *  against its right edge under a centred `W` is the arrangement that made the
 *  strip look mis-set. The name stays left, because a name is read and not
 *  compared. */
/** The cell class for a column, so the row prints the same alignment the head
 *  does. Exported because `TableRow` is the other half of this table and the two
 *  drifting apart is exactly what the shared `COLUMNS` list exists to stop. */
export function cellAlign(key: Column["key"]): string {
  return TEXT[COLUMNS.find((column) => column.key === key)?.align ?? "center"];
}

/** Whether this column stands down under a thumb — **unless the table is ORDERED
 *  by it**, which is the exception that keeps the rule honest.
 *
 *  `display: none` does not quieten a column, it deletes it: the pressed plate,
 *  the arrow and `aria-sort` all live on that cell, so a phone arriving on a
 *  shared `?sort=against` link would show rows in an order with no visible
 *  author and nothing in the accessibility tree to say what it was. The wrapper
 *  the table sits in already scrolls sideways (`league/page`), so the one case
 *  where nine columns will not fit is the case that was always going to scroll.
 *
 *  Found by key like `cellAlign`, and for the same reason: the head, the row and
 *  the loading skeleton have to agree, and `COLUMNS` is where they agree. */
export function deskOnly(key: Column["key"], sort: SortKey): string {
  const column = COLUMNS.find((entry) => entry.key === key);
  return standDown(column?.deskOnly, key === sort);
}

/** A column the reader can order by. `form` is a run of letters and `team` a
 *  name, and neither is a quantity. */
function sortable(key: Column["key"]): key is SortKey {
  return key !== "team" && key !== "form";
}

export default function Columns({
  sort,
  descending,
}: {
  sort: SortKey;
  descending: boolean;
}) {
  return (
    <thead>
      <HeadRow>
        {COLUMNS.map((column) => {
          // The name column has no plate, and `NameHead` is that cell.
          if (column.key === "team") return <NameHead key={column.key} label={column.label} />;
          if (!sortable(column.key)) {
            return (
              <Head
                key={column.key}
                width={`${column.width} ${deskOnly(column.key, sort)}`}
                title={column.title}
              >
                <span className={PLATE}>{column.label}</span>
              </Head>
            );
          }
          const here = column.key === sort;
          return (
            <SortHead
              key={column.key}
              width={`${column.width} ${deskOnly(column.key, sort)}`}
              title={column.title}
              align={column.align}
              href={sortHref(column.key, sort, descending)}
              label={column.label}
              mute={column.mute}
              sorted={sortedAs(here, descending)}
            />
          );
        })}
      </HeadRow>
    </thead>
  );
}
