/** A column head that sorts, drawn PRESSED when it is the one in force.
 *
 *  Split out of `StatBoard.tsx` at CODE_RULES §4's hard ceiling.
 *
 *  **Deliberately not in `components/league/TableHeads.tsx`**, which shares the
 *  head strip between the two league tables. That file records a decision
 *  against holding a sortable head — "`Columns.tsx` keeps the pressed variant
 *  and the link branch, because only one of the two tables sorts" — and moving
 *  this there would make it the second at a file that declined the first, which
 *  is an extraction at two (§1). The two cannot share a body either: Columns'
 *  head is a `<Link>` carrying a server-built `sortHref`, and this is a
 *  `<button onClick>` in a client component.
 */
export default function SortHead({
  label,
  title,
  sorted,
  descending,
  onSort,
}: {
  label: string;
  title: string;
  sorted: boolean;
  descending: boolean;
  onSort: () => void;
}) {
  return (
    // `aria-sort` belongs on the cell and not on the control inside it — the
    // role that carries it is `columnheader`, which is the `<th>`.
    <th
      scope="col"
      className="p-0 font-bold"
      title={title}
      aria-sort={sorted ? (descending ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={onSort}
        className={`flex h-6 w-full items-center justify-end px-1.5 ${
          sorted ? "cm-bevel-pressed text-accent" : "cm-bevel"
        }`}
      >
        {label}
      </button>
    </th>
  );
}
