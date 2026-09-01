"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { type StatCategory } from "@epl/core";

// The category select — one grey box, at the left of the strip.
//
// It was two for a day. The right-hand one chose between fantasy points and the
// raw total, and it stopped being a choice the moment the board began printing
// BOTH columns (Craig, 1 Sep: "remove the dropdown row since thats now
// redundant"). A control that changes nothing you cannot already see is furniture.
//
// What it offers is the categories in the CURRENT GROUP and not all twelve. The
// foot row picks the group, this picks within it — three or four options rather
// than a scroll, which is the whole reason the row exists.
//
// A GET form first and JavaScript second, the pattern `schedule/Controls.tsx`
// sets: without a script the button submits and the page works; with one,
// changing the select navigates on the spot. A control that needs a script stops
// working on the connection where it matters most.

const HERE = "/league/team-stats";

export default function Filters({
  categories,
  category,
  group,
}: {
  categories: readonly StatCategory[];
  category: string;
  /** Carried through the form so picking a category does not drop the group. */
  group: string;
}) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form === null) return;

    const query = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string" && value !== "") query.set(name, value);
    }
    const search = query.toString();
    router.push(search === "" ? HERE : `${HERE}?${search}`);
  }

  return (
    <form method="get" action={HERE} className="flex items-center gap-2">
      <input type="hidden" name="group" value={group} />
      <select
        name="cat"
        aria-label="Category"
        value={category}
        onChange={pick}
        // The plate owns its ink — dark on grey at 7.52:1 — so no `text-*` here
        // and no ground either. Only the closed control is ours; the option list
        // is the platform's popup and cannot be styled, which is why this is
        // still a `<select>`. Sized by its own longest option: a percentage cap
        // clipped "Goals against" to "Goals agains" on a 390 phone.
        className="cm-bevel min-h-11 px-2.5 text-sm font-semibold lg:min-h-9"
      >
        {categories.map((entry) => (
          <option key={entry.key} value={entry.key}>
            {entry.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="cm-bevel min-h-11 px-3 text-sm font-medium lg:min-h-9">
          Show
        </button>
      </noscript>
    </form>
  );
}
