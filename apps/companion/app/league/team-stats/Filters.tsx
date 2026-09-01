"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { CATEGORIES } from "@epl/core";

// The two grey boxes above the board.
//
// Craig, 1 Sep 2026, reading CM's stat screen: "theres two grey boxes, that can
// be our filter, left is the category, right is by Fantasy points, or raw value
// (fantasy points default)". CM's own `View ▾` and `Filter ▾` sit exactly there,
// at the two ends of the strip above the panel (the Average Rating shot).
//
// A GET form first and JavaScript second, which is the pattern `schedule/
// Controls.tsx` already sets: without a script the button submits and the page
// works; with one, changing either select navigates on the spot. A control that
// needs a script to work stops working on the connection where it matters most.
//
// Not shared with that file, deliberately. Its `Select` is private to it, and
// this is the SECOND place a bevelled select appears — CODE_RULES §1 puts the
// extraction at three, and the two differ already: that strip is three controls
// wide and left-packed, this one is two pushed to opposite ends.

const HERE = "/league/team-stats";

export default function Filters({
  category,
  measure,
}: {
  category: string;
  measure: string;
}) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form === null) return;

    // The whole form, not just the select that moved: picking a category must
    // not drop the measure beside it.
    const query = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string" && value !== "") query.set(name, value);
    }
    const search = query.toString();
    router.push(search === "" ? HERE : `${HERE}?${search}`);
  }

  return (
    <form
      method="get"
      action={HERE}
      // `justify-between` and NOT a `flex-1` spacer between the two. A spacer
      // is a third flex item competing for the same row, and on a 390 phone it
      // won — both selects were squeezed until their labels clipped ("Goals
      // ag…", "Raw tot…"). Space-between gives the leftover to the GAP, which
      // is what "at the two ends" actually means.
      className="flex flex-wrap items-center justify-between gap-2"
    >
      {/* CM's strip has its two controls at the ends of the panel's width and
          nothing in the middle. */}
      <Select
        name="cat"
        label="Category"
        value={category}
        options={CATEGORIES.map((entry) => ({ value: entry.key, label: entry.label }))}
        onPick={pick}
      />
      <Select
        name="by"
        label="Ranked by"
        value={measure}
        options={[
          { value: "points", label: "Fantasy points" },
          { value: "value", label: "Raw total" },
        ]}
        onPick={pick}
      />
      <noscript>
        <button type="submit" className="cm-bevel min-h-11 px-3 text-sm font-medium lg:min-h-9">
          Show
        </button>
      </noscript>
    </form>
  );
}

interface Option {
  value: string;
  label: string;
}

function Select({
  name,
  label,
  value,
  options,
  onPick,
}: {
  name: string;
  label: string;
  value: string;
  options: Option[];
  onPick: (event: FormEvent<HTMLSelectElement>) => void;
}) {
  return (
    <select
      name={name}
      aria-label={label}
      value={value}
      onChange={onPick}
      // The plate owns its ink — dark on grey at 7.52:1 — so no `text-*` here
      // and no ground either. Only the closed control is ours; the option list
      // is the platform's popup and cannot be styled, which is why this is still
      // a `<select>`.
      // Sized by its own longest option and nothing else. Two earlier attempts
      // both clipped a label on a 390 phone: `max-w-[45%]` cut "Goals against"
      // to "Goals agains", and `flex-1 basis-0` split the row evenly and cut
      // BOTH. A truncated label reads as a typo rather than as an ellipsis, and
      // the widest pair here — "Assists (fantasy)" and "Fantasy points" — still
      // fits a 390 row when neither is being squeezed.
      className="cm-bevel min-h-11 px-2.5 text-sm font-semibold lg:min-h-9"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
