"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { COLUMNS } from "./columns";
import { PLATE_TYPE, PRESSABLE } from "./BoardControls";

// CM's `Sort By ▾` (`cm9900/25.jpg`): a thumb's way to reorder the board without reaching the heads.
// `ClubPicker`'s shape, copied: two selects, which CODE_RULES §1 leaves duplicated. A new sort takes its own direction.

export default function SortPicker({
  sort,
  action,
  children,
}: {
  /** The column the board is ordered by now. */
  sort: string;
  action: string;
  /** The rest of the query as hidden fields, rendered on the server. */
  children: React.ReactNode;
}) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form === null) return;
    const next = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string" && value.trim() !== "") next.set(name, value.trim());
    }
    router.push(`${action}?${next.toString()}`, { scroll: false });
  }

  return (
    <form method="get" action={action} className="flex gap-1.5">
      {children}
      <select
        name="sort"
        aria-label="Sort by"
        value={sort}
        onChange={pick}
        className={`cm-bevel w-full ${PLATE_TYPE}`}
      >
        {COLUMNS.filter((column) => column.key !== "name").map((column) => (
          <option key={column.key} value={column.key}>
            {column.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={PRESSABLE}>
          Sort
        </button>
      </noscript>
    </form>
  );
}
