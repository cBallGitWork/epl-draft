/** A column head that sorts, drawn PRESSED when it is the one in force.
 *
 *  Split out of `StatBoard.tsx` at CODE_RULES §4's hard ceiling.
 *
 *  **Deliberately not in `components/league/TableHeads.tsx`, and no longer for
 *  the reason this said.** It used to cite that file's decision against holding
 *  a sortable head — "because only one of the two tables sorts" — which
 *  `TableHeads` itself retracted when it gained `SortHead`: three tables sort
 *  now, and it holds the head they share. Quoting a reason its own source has
 *  withdrawn is how a docblock outlives the thing it was describing.
 *
 *  The true reason is the mechanism, and it has not changed: `TableHeads`'
 *  `SortHead` is a `<Link>` carrying a server-built `sortHref`, because those
 *  three tables are ordered by the SERVER and the ordering survives being
 *  shared. This is a `<button onClick>` in a client component, ordering an array
 *  already in the browser. They share a shape and not a body.
 *
 *  **The shape is at two, which §1 leaves alone** — this and the inline head in
 *  `prem/club/[code]/stats/PlayerBoard`, whose geometry is byte-identical
 *  (`flex h-6 w-full items-center justify-end px-1.5` over `cm-bevel-pressed`
 *  or `cm-bevel`). Recorded rather than extracted, so the third one knows it is
 *  the third. What the two do NOT share is `aria-sort`, and that was a real
 *  defect rather than a variation.
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
