"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { SELECT } from "./ButtonLink";
import { SUBMIT } from "@/app/desk";

// One URL parameter chosen from a list, as CM's `Sort By ▾` plate (`cm9900/25.jpg`): every GET-form select in the app.
// It works with no script; with one, a change navigates at once, holds the page still and shows the pick while it loads.

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
  children?: ReactNode;
}) {
  const router = useRouter();
  // The pick, held against the value it replaced so a fresh `value` from the server wins.
  const [asked, setAsked] = useState<{ from: string; to: string } | null>(null);
  const shown = asked !== null && asked.from === value ? asked.to : value;

  function pick(event: FormEvent<HTMLSelectElement>) {
    const select = event.currentTarget;
    if (select.form === null) return;
    const next = new URLSearchParams();
    for (const [field, entry] of new FormData(select.form)) {
      if (typeof entry === "string" && entry.trim() !== "") next.set(field, entry.trim());
    }
    const search = next.toString();
    const href = search === "" ? action : `${action}?${search}`;
    if (!follow(href)) return;
    setAsked({ from: value, to: select.value });
    router.push(href, { scroll: false });
  }

  return (
    <form method="get" action={action} className="flex shrink-0 gap-1.5">
      {children}
      <select name={name} aria-label={label} value={shown} onChange={pick} className={`${SELECT} w-full`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={SUBMIT}>
          Show
        </button>
      </noscript>
    </form>
  );
}

/** Taps a link to `href` without following it: false when a `LeaveGuard` caught the tap to ask first. */
function follow(href: string): boolean {
  const link = document.createElement("a");
  link.href = href;
  let free = false;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    free = true;
  });
  document.body.append(link);
  link.click();
  link.remove();
  return free;
}
