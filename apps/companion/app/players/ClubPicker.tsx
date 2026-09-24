"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { PLATE_TYPE, PRESSABLE } from "./BoardControls";

// Which club's players the board lists.
//
// Craig, 10 Sep 2026: *"put club in the filters section though!"*. It is the one
// thing the board genuinely lost when `Pos`, `Club` and `Sta` stopped being
// columns — position and status have had filters since 6 Sep, so removing those
// two columns cost nothing a reader could not already do, but nothing replaced
// sorting the board by club.
//
// **A `<select>` and not chips, which is the whole reason it is a separate
// control.** Every other filter on this board is a small closed set — three
// statuses, four positions — and a row of plates is the right object for those.
// There are twenty clubs. Twenty plates is a wall that would take the drawer
// back to the three wrapped rows Craig had just asked to collapse, and it would
// put the least-used filter on the board in the most space.
//
// **The shape is `league/team-stats/Filters`'s, deliberately**, down to the
// `<noscript>` button: changing the select navigates when a script is running,
// and submits the form when one is not. Every other control on this page is a
// link precisely so the board needs no JavaScript, and a filter that quietly
// stopped working without one would be the exception that makes the rule
// worthless.

/** What the URL says when no club is chosen. Empty rather than "all", so the
 *  parameter simply is not there — which is what makes the option list's first
 *  entry and an absent filter the same state rather than two. */
const ANY = "";

export default function ClubPicker({
  clubs,
  club,
  action,
  children,
}: {
  /** The clubs actually in the pool, in the order they should be offered. */
  clubs: readonly string[];
  /** The chosen club, or empty for all of them. */
  club: string;
  action: string;
  /** The rest of the query as hidden inputs, rendered on the SERVER — see
   *  `Search`, which takes them the same way and for the same reason: a GET form
   *  posts only its own fields, so without these choosing a club would clear the
   *  sort, the other filters, the stat group and the drawer. */
  children: React.ReactNode;
}) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form === null) return;

    // Read back out of the form rather than built from `club`, so this cannot be
    // the one control that forgets the others — the same construction `Search`
    // uses, and the bug `href()` prevents for every link on the page.
    const next = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string" && value.trim() !== "") next.set(name, value.trim());
    }
    const search = next.toString();
    router.push(search === "" ? action : `${action}?${search}`);
  }

  return (
    <form method="get" action={action} className="flex gap-1.5">
      {children}
      <select
        name="club"
        aria-label="Club"
        value={club}
        onChange={pick}
        // **`PLATE_TYPE` and not the app-wide `SELECT`**, so this sits at the
        // same height and in the same type as every plate beside it — `SELECT`
        // is `text-sm font-semibold` in sentence case, which is the third type
        // size this row was trying not to have.
        //
        // No `text-*` colour and no ground: the plate owns its ink, dark on grey
        // at 7.52:1. Only the CLOSED control is ours — the option list is the
        // platform's popup and cannot be styled, which is the known cost of a
        // `<select>` and, at twenty options, still cheaper than the alternative.
        className={`cm-bevel w-full ${PLATE_TYPE}`}
      >
        <option value={ANY}>All clubs</option>
        {clubs.map((code) => (
          <option key={code} value={code}>
            {code}
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
