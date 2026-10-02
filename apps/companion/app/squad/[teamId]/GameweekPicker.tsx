"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { SELECT } from "../../components/shell/ButtonLink";
import { SUBMIT } from "@/app/desk";
import { teamHref } from "../routes";
import type { GameweekOption } from "./weeks";

// Which gameweek of a squad is on screen, as Fantrax's period selector (Craig, 1 Oct 2026). A GET form, so it
// works with no script; with one, a change navigates as a link would. Keyed by `shown` at the call site.

export default function GameweekPicker({
  slug,
  shown,
  options,
}: {
  /** What the URL called the team, so `/squad/me` stays `/squad/me`. */
  slug: string;
  shown: number;
  options: readonly GameweekOption[];
}) {
  const router = useRouter();
  // The week asked for, held while the page loads it; a lineup kept by the leave prompt keeps `shown`.
  const [asked, setAsked] = useState(shown);

  function pick(event: FormEvent<HTMLSelectElement>) {
    const gameweek = Number(event.currentTarget.value);
    const href = teamHref(slug, gameweek);
    if (!follow(href)) return;
    setAsked(gameweek);
    router.push(href);
  }

  return (
    <form method="get" action={teamHref(slug)} className="flex shrink-0 gap-1.5">
      {/* A height as well as `SELECT`'s floor: WebKit ignores `min-height` on a select and drew it 33px at 390. */}
      <select name="gw" aria-label="Gameweek" value={asked} onChange={pick} className={`${SELECT} h-11 lg:h-9`}>
        {options.map((option) => (
          <option key={option.period} value={option.gameweek}>
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

/** Taps a link to `href` without following it: false when the planner's `LeaveGuard` caught the tap to ask first. */
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
