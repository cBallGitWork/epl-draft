import type { CSSProperties } from "react";

// Two sides' figures either side of one column of labels.
//
// **`cm9900/22.jpg`'s shape**: a centred column of names with each side's number
// in an index block left and right. It is how the game compares any two things,
// and it is right for a record because the reader's question is "which of these
// two is better at this" — which two separate tables cannot answer without
// being read twice.

/** One side of the comparison. */
export interface Column {
  label: string;
  /** That side's own colour, when the two sides are different things.
   *
   *  Omitted, the blocks take `--cm-index` from whichever shell is above — one
   *  colour down both sides, which is what `22.jpg` itself does and what a
   *  club's home-against-away wants, because both columns are that club.
   *
   *  Given, it is because the columns are two DIFFERENT clubs: the match header
   *  above has already set them against each other on their own plates, and
   *  leaving the figures in one club's colour says the other club's numbers
   *  belong to it. */
  plate?: { background: string; ink: string };
}

export interface Row {
  label: string;
  left: number;
  right: number;
}

export default function Comparison({
  rows,
  left,
  right,
}: {
  rows: readonly Row[];
  left: Column;
  right: Column;
}) {
  return (
    // **Capped and centred on the desk.** A comparison is read ACROSS one line,
    // and full width at 1440 put the two figures 1,400px apart with an empty
    // middle — the eye cannot pair them, which is the one thing this shape
    // exists to do. `cm9900/22.jpg` keeps its two columns close and lets the
    // panel hold the air. The phone is already narrow enough to need no cap.
    <table className="w-full border-collapse text-sm lg:mx-auto lg:max-w-2xl">
      <thead>
        <tr className="text-3xs uppercase">
          <Heading column={left} />
          <th scope="col" className="p-0" />
          <Heading column={right} />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-bg">
            <Figure value={row.left} column={left} />
            {/* The label between them, which is what makes it a comparison
                rather than two tables — the eye reads across one line. */}
            <td className="px-2 text-center text-2xs uppercase text-muted">{row.label}</td>
            <Figure value={row.right} column={right} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Heading({ column }: { column: Column }) {
  return (
    <th scope="col" className="w-16 p-0 font-bold lg:w-24">
      <span className="flex h-7 items-center justify-center truncate px-1">{column.label}</span>
    </th>
  );
}

/** `--cm-index` re-pointed on the cell rather than a second set of classes: the
 *  block already reads that variable, so a side with its own colour is the same
 *  object with a different value in it. */
function Figure({ value, column }: { value: number; column: Column }) {
  return (
    <td
      className="cm-index numeric px-1.5 text-center text-sm font-bold"
      style={
        column.plate === undefined
          ? undefined
          : ({
              "--cm-index": column.plate.background,
              "--cm-index-ink": column.plate.ink,
            } as CSSProperties)
      }
    >
      {value}
    </td>
  );
}
