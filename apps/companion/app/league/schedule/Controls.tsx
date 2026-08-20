"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { COMPETITIONS, type LeagueTeam } from "@epl/core";
import { yoursFirst } from "../../mine";

// The three dropdowns: which gameweek, which competition, and whose fixture
// list.
//
// They build their own labels. What the page hands over is the league's own data
// — the rounds it covers, the teams in it, who is reading — and what a control
// says about that is the control's business; the page was assembling three
// arrays of `{value, label}` for a component that then only printed them.
//
// A GET form first and JavaScript second. Without a script the button submits
// and the page works; with one, changing any select navigates on the spot, which
// is what a dropdown is supposed to do on a phone. Same reasoning as the
// disclosure this replaced — a control that needs a script to work stops working
// on the connection where it matters most.
//
// Nothing here is withheld anywhere else: team names and gameweek numbers are
// public all week, which is what keeps a client component harmless on a page
// whose siblings hide lineups.

/** This page. Written once because the form posts to it and the router pushes
 *  to it, and a route that appears twice is a route that can disagree. */
const HERE = "/league/schedule";

export default function Controls({
  gameweeks,
  gameweek,
  competition,
  teams,
  team,
  mine,
}: {
  /** Every gameweek the league's calendar covers, ascending. */
  gameweeks: number[];
  gameweek: number;
  competition: string;
  teams: readonly LeagueTeam[];
  team: string;
  mine: string | null;
}) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form === null) return;

    // Read back the whole form rather than just the select that moved, so
    // choosing a competition cannot drop the gameweek beside it.
    const query = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string" && value !== "") query.set(name, value);
    }

    // Picking a gameweek is the way back out of a fixture list. The two are
    // views of the same season and only one can be on screen, so the control
    // you just used decides which — otherwise choosing a gameweek while reading
    // a fixture list appears to do nothing at all.
    if (event.currentTarget.name === "gw") query.delete("team");

    router.push(`${HERE}?${query}`);
  }

  return (
    <form action={HERE} className="flex flex-wrap gap-1.5 px-3">
      <div className="flex min-w-0 basis-full gap-1.5">
        <Select
          name="gw"
          label="Round"
          value={String(gameweek)}
          options={gameweeks.map((entry) => ({
            value: String(entry),
            label: `Gameweek ${entry}`,
          }))}
          onPick={pick}
        />
        <Select
          name="comp"
          label="Competition"
          value={competition}
          options={[
            { value: "", label: "All competitions" },
            ...COMPETITIONS.map((entry) => ({ value: entry.id, label: entry.name })),
          ]}
          onPick={pick}
        />
      </div>
      {/* Its own row. Three selects across a phone leaves each of them too
          narrow to read the option it is showing, and a control whose value you
          cannot read is not a control. */}
      <Select
        name="team"
        label="Fixture list"
        value={team}
        options={[
          { value: "", label: "Fixture list" },
          // Yours first and named as yours, alphabetical under that: sixteen
          // names is a scroll and the one a manager came for is his own.
          ...yoursFirst(
            [...teams].sort((a, b) => a.name.localeCompare(b.name)),
            (entry) => entry.teamId === mine,
          ).map((entry) => ({
            value: entry.teamId,
            label: entry.teamId === mine ? `${entry.name} (you)` : entry.name,
          })),
        ]}
        onPick={pick}
      />
      <noscript>
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium"
        >
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
      className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 text-sm font-semibold text-ink"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
