"use client";

import { useMemo, useState } from "react";
import type { Club, LeaguePlayerState, RosterLimits, RosteredTeam, RosterSlot } from "@epl/core";
// The look without the component: this one link leaves the app, so it stays a
// plain anchor with `target="_blank"` rather than becoming a router link.
import { BUTTON } from "../shell/ButtonLink";
import {
  applyMove,
  eligibilityOf,
  eligibleSlots,
  isActive,
  legalMoves,
  playerName,
  violations,
} from "@epl/core";
import type { Move, Violation } from "@epl/core";
import MoveSheet from "./MoveSheet";
import Pitch from "./Pitch";

// Planning a lineup, not submitting one.
//
// The second client component in the app, and the first that needed to be. The
// whole point is an XI you can rearrange and look at before committing to it, so
// the edited shape lives in browser state; the real roster is untouched and
// Fantrax remains the only thing that can change it. The button at the bottom
// hands the manager over rather than pretending we can write.

/** A broken rule, said out loud and with the number that broke it.
 *
 *  Most of these arrive already broken — the XI comes from Fantrax and the
 *  commissioner can narrow an eligibility or lower a cap underneath it — so the
 *  wording never implies the manager just did it. */
function sentence(violation: Violation, nameOf: (id: string) => string): string {
  switch (violation.kind) {
    case "too-many-active":
      return `${violation.count} in the XI — the league allows ${violation.cap}.`;
    case "too-many-reserve":
      return `${violation.count} on the bench — the league seats ${violation.cap}.`;
    case "position-over-cap":
      return `${violation.count} at ${violation.position} — the cap is ${violation.cap}.`;
    case "not-eligible":
      return `${nameOf(violation.fantraxId)} is not eligible at ${violation.position}.`;
  }
}

export default function LineupPlanner({
  team,
  clubs,
  players,
  limits,
  fantraxUrl,
}: {
  team: RosteredTeam;
  clubs: Map<number, Club>;
  /** Plain array rather than the `Eligibility` map: this crosses the server
   *  boundary, and the map is built here where it is used. */
  players: LeaguePlayerState[];
  limits: RosterLimits;
  fantraxUrl: string;
}) {
  const [slots, setSlots] = useState<RosterSlot[]>(() => team.players.map((p) => p.slot));
  const [selected, setSelected] = useState<string | null>(null);

  const eligibility = useMemo(() => eligibilityOf(players), [players]);
  const nameOf = useMemo(() => {
    const names = new Map(team.players.map((p) => [p.slot.fantraxId, playerName(p)]));
    return (id: string) => names.get(id) ?? id;
  }, [team]);

  // The pitch renders the EDITED slots, so the preview is the thing being
  // planned. Rebuilt from the real team so `lineup()` and `Pitch` are reused
  // exactly as they are — the planner changes assignments, not players.
  const preview = useMemo<RosteredTeam>(() => {
    const bySlot = new Map(slots.map((slot) => [slot.fantraxId, slot]));
    return {
      ...team,
      players: team.players.map((p) => ({ ...p, slot: bySlot.get(p.slot.fantraxId) ?? p.slot })),
    };
  }, [team, slots]);

  const dirty = useMemo(
    () => team.players.some((p, i) => p.slot.status !== slots[i]?.status || p.slot.position !== slots[i]?.position),
    [team, slots],
  );

  const moves = selected ? legalMoves(slots, eligibility, limits, selected) : [];
  const options = selected ? eligibleSlots(slots, eligibility, limits, selected) : [];

  // What is wrong with the XI as it stands. No move offered above can create any
  // of it, so an empty list here is the ordinary case and anything in it came
  // from Fantrax — which is exactly why it has to be said rather than assumed
  // away.
  const broken = violations(slots, eligibility, limits);
  const empty = limits.maxActivePlayers - slots.filter(isActive).length;

  function play(move: Move) {
    setSlots((current) => applyMove(current, move));
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <Pitch team={preview} clubs={clubs} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xs font-bold uppercase tracking-widest text-faint">
          {dirty ? "Planned — not submitted" : "Tap a player to move him"}
        </h2>
        {dirty ? (
          <button
            type="button"
            onClick={() => {
              setSlots(team.players.map((p) => p.slot));
              setSelected(null);
            }}
            className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium hover:bg-raised"
          >
            Reset
          </button>
        ) : null}
      </div>

      {broken.length > 0 || empty > 0 ? (
        <ul className="flex flex-col gap-1 rounded-lg border border-line bg-surface px-3 py-2">
          {broken.map((violation) => (
            <li key={sentence(violation, nameOf)} className="text-2xs text-bad">
              {sentence(violation, nameOf)}
            </li>
          ))}
          {/* Not a violation, and deliberately worded so it cannot be read as one:
              Fantrax publishes no minimum per position, so an under-filled XI
              breaks no rule the commissioner set. */}
          {empty > 0 ? (
            <li className="text-2xs text-muted">
              {empty} empty {empty === 1 ? "place" : "places"} in the XI — allowed, and nothing
              scores from them.
            </li>
          ) : null}
        </ul>
      ) : null}

      <ul className="flex flex-col gap-1">
        {slots.map((slot) => {
          const isOpen = selected === slot.fantraxId;
          return (
            <li key={slot.fantraxId} className="flex flex-col">
              <button
                type="button"
                onClick={() => setSelected(isOpen ? null : slot.fantraxId)}
                aria-expanded={isOpen}
                className="elev flex min-h-11 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-left hover:bg-raised"
              >
                <span className="numeric w-6 text-2xs tracking-widest text-faint">
                  {slot.position ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {nameOf(slot.fantraxId)}
                </span>
                {!isActive(slot) ? (
                  <span className="numeric rounded bg-raised px-1.5 py-0.5 text-2xs font-bold text-mid">
                    RES
                  </span>
                ) : null}
              </button>

              {isOpen ? (
                <MoveSheet moves={moves} options={options} nameOf={nameOf} onPlay={play} />
              ) : null}
            </li>
          );
        })}
      </ul>

      <a
        href={fantraxUrl}
        target="_blank"
        rel="noreferrer"
        className={BUTTON}
      >
        Set this lineup in Fantrax
      </a>
    </div>
  );
}
