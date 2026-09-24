"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { PLATE_TYPE, PRESSABLE } from "./BoardControls";

// One URL parameter chosen from a list, as CM's `Sort By ▾` plate (`cm9900/25.jpg`): Data's club, sort and category
// selects. A GET form, so it works with no script; with one, a change navigates at once and holds the page still.

export interface QueryOption {
  value: string;
  label: string;
}

export default function QuerySelect({
  name,
  label,
  value,
  options,
  action,
  children,
}: {
  /** The query parameter it sets. */
  name: string;
  /** Its accessible name. */
  label: string;
  value: string;
  /** In the order offered; an option whose value is empty clears the parameter. */
  options: readonly QueryOption[];
  action: string;
  /** The rest of the query as hidden fields, rendered on the server (`Carried`). */
  children: ReactNode;
}) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form === null) return;
    const next = new URLSearchParams();
    for (const [field, entry] of new FormData(form)) {
      if (typeof entry === "string" && entry.trim() !== "") next.set(field, entry.trim());
    }
    const search = next.toString();
    router.push(search === "" ? action : `${action}?${search}`, { scroll: false });
  }

  return (
    <form method="get" action={action} className="flex gap-1.5">
      {children}
      <select name={name} aria-label={label} value={value} onChange={pick} className={`cm-bevel w-full ${PLATE_TYPE}`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={PRESSABLE}>
          Show
        </button>
      </noscript>
    </form>
  );
}
