"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { SELECT } from "../../components/shell/ButtonLink";
import { CATEGORIES } from "./categories";
import { TEAM_STATS } from "../PremNav";

// The one grey box on the board, at the left of its own strip.
//
// **GET form first and JavaScript second**, the pattern `schedule/Controls` set
// and `league/team-stats/Filters` follows: the form works with the script gone,
// and `onChange` is the convenience on top rather than the mechanism.
//
// The plate owns its ink — dark on grey at 7.52:1 — so no `text-*` and no ground
// here. Only the closed control is ours; the option list is the platform's popup
// and cannot be styled, which is why this is still a `<select>`.

export default function Filters({ category }: { category: string }) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    router.push(`${TEAM_STATS}?cat=${event.currentTarget.value}`);
  }

  return (
    <form method="get" action={TEAM_STATS} className="flex items-center gap-2">
      <select name="cat" aria-label="Category" value={category} onChange={pick} className={SELECT}>
        {CATEGORIES.map((entry) => (
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
