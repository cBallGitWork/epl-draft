"use client";

import { useMemo, useState } from "react";
import type {
  LeaguePlayerState,
  Move,
  RosterLimits,
  RosterSlot,
  RosteredTeam,
  SquadPlayerDetail,
  Violation,
} from "@epl/core";
// The look without the component: this one link leaves the app, so it stays a
// plain anchor with `target="_blank"` rather than becoming a router link.
import { BUTTON } from "../shell/ButtonLink";
import {
  applyMove,
  eligibilityOf,
  eligibleSlots,
  isActive,
  legalMoves,
  lineup,
  playerName,
  violations,
} from "@epl/core";
import LineupPitch from "./LineupPitch";
import type { PitchRow } from "./PitchRows";
import MoveDialog from "./MoveDialog";

// Planning a lineup, not submitting one.
//
// The whole point is an XI you can rearrange and look at before committing to
// it, so the edited shape lives in browser state; the real roster is untouched
// and Fantrax remains the only thing that can change it. The button at the
// bottom hands the manager over rather than pretending we can write.
//
// Every rule it enforces is the commissioner's, read from `getLeagueInfo` and
// applied by `moves.ts`: how many may start, how many may sit, how many at each
// position, and which positions each player is eligible for. Nothing about the
// shape is assumed here — a 1-5-2-3 is legal in this league and would be legal
// on screen.

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
  details,
  players,
  limits,
  fantraxUrl,
  pending,
}: {
  team: RosteredTeam;
  /** The squad's football detail, flat and unarranged. Arranging it is this
   *  component's job and it changes with every move. */
  details: SquadPlayerDetail[];
  /** Plain array rather than the `Eligibility` map: this crosses the server
   *  boundary, and the map is built here where it is used. */
  players: LeaguePlayerState[];
  limits: RosterLimits;
  fantraxUrl: string;
  /** Points Fantrax has not credited yet — a clean sheet is settled at the final
   *  whistle and FPL has been paying it since the hour mark. Null when there are
   *  none to preview, and never a nought. */
  pending: number | null;
}) {
  const [slots, setSlots] = useState<RosterSlot[]>(() => team.players.map((p) => p.slot));
  // Two ways in, and they are different questions, reached by the same target on
  // the first and second tap. `picked` is the quick swap: one tap chooses a man,
  // and the pitch answers "who can come off for him" by dimming everyone who
  // cannot. `opened` is the full list for one player, which is the only place a
  // move with no second player — off to the bench, across to another position —
  // can be offered.
  const [picked, setPicked] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

  const eligibility = useMemo(() => eligibilityOf(players), [players]);
  const detailOf = useMemo(
    () => new Map(details.map((d) => [d.rostered.slot.fantraxId, d])),
    [details],
  );
  const nameOf = useMemo(() => {
    const names = new Map(details.map((d) => [d.rostered.slot.fantraxId, playerName(d.rostered)]));
    return (id: string) => names.get(id) ?? id;
  }, [details]);

  // The pitch renders the EDITED slots, so what is on screen is the thing being
  // planned. Rebuilt from the real team so `lineup()` is reused exactly as it is
  // — the planner changes assignments, not players.
  const { rows, bench, shape } = useMemo(() => {
    const bySlot = new Map(slots.map((slot) => [slot.fantraxId, slot]));
    const arranged = lineup({
      ...team,
      players: team.players.map((p) => ({ ...p, slot: bySlot.get(p.slot.fantraxId) ?? p.slot })),
    });
    // The detail was joined once from the roster as it arrived, so its slot is
    // the PRE-MOVE one. Everything drawn from `arranged` is post-move, so the
    // edited slot is spliced back in — otherwise the bench prints a man's old
    // position under him while standing him in his new place, and the label and
    // the order contradict each other on screen. The join's other halves — his
    // club, his fixtures, his points — are facts about the man and do not move
    // when his manager rearranges the team.
    const detail = (slot: RosterSlot): SquadPlayerDetail[] => {
      const joined = detailOf.get(slot.fantraxId);
      return joined === undefined ? [] : [{ ...joined, rostered: { ...joined.rostered, slot } }];
    };
    return {
      rows: arranged.lines.map<PitchRow<SquadPlayerDetail>>((line) => ({
        label: line.position,
        players: line.players.flatMap((p) => detail(p.slot)),
      })),
      bench: arranged.bench.flatMap((p) => detail(p.slot)),
      // Free, and it has to come from HERE rather than from the server: this is
      // the edited arrangement, so the shape changes under the reader's thumb as
      // he moves a man. A formation named on the server would be the one he
      // started with.
      shape: arranged.shape,
    };
  }, [team, slots, detailOf]);

  const dirty = useMemo(
    () =>
      team.players.some(
        (p, i) => p.slot.status !== slots[i]?.status || p.slot.position !== slots[i]?.position,
      ),
    [team, slots],
  );

  // What is wrong with the XI as it stands. No move offered can create any of
  // it, so an empty list is the ordinary case and anything in it came from
  // Fantrax — which is exactly why it has to be said rather than assumed away.
  const broken = violations(slots, eligibility, limits);
  const empty = limits.maxActivePlayers - slots.filter(isActive).length;

  function play(move: Move) {
    setSlots((current) => applyMove(current, move));
    setPicked(null);
    setOpened(null);
  }

  // Everything the picked man may do, and the men he may do it with.
  const pickedMoves = picked === null ? [] : legalMoves(slots, eligibility, limits, picked);
  const partners = new Set(
    pickedMoves.flatMap((move) => (move.kind === "swap" ? [move.withId] : [])),
  );

  /** Swapping with a man who occupies a position the picked player is eligible
   *  for means taking that position. Where he is not — a full XI lets him come
   *  in anywhere, so the partner need not be in a position he can fill — the
   *  first legal destination stands, because any of them is one man in and one
   *  man out. */
  function swapWith(partnerId: string) {
    const candidates = pickedMoves.flatMap((move) =>
      move.kind === "swap" && move.withId === partnerId ? [move] : [],
    );
    const theirPosition = slots.find((slot) => slot.fantraxId === partnerId)?.position;
    const move = candidates.find((swap) => swap.to === theirPosition) ?? candidates[0];
    // Only offered for a partner the pitch has lit, and it lit him from this
    // same list — so an empty one is unreachable rather than unhandled.
    if (move) play(move);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* The shape, above the grass, because that is where it is read. It is the
          first thing Championship Manager says about an eleven, and it moves as
          the eleven does — a 1-3-4-3 becomes a 1-3-5-2 the moment a midfielder
          comes on for a forward, which is the whole point of naming it on the
          screen where the moving happens. */}
      <div className="flex items-baseline justify-between gap-3 px-1">
        <span className="numeric text-2xs font-bold text-faint">{shape}</span>
        {pending === null ? null : (
          <span className="numeric text-2xs font-semibold text-accent">+{pending}</span>
        )}
      </div>

      <LineupPitch
        rows={rows}
        bench={bench}
        availabilityOf={(player) => {
          const id = player.rostered.slot.fantraxId;
          if (picked === null) return "idle";
          if (picked === id) return "picked";
          return partners.has(id) ? "swappable" : "blocked";
        }}
        onPick={(player) => {
          const id = player.rostered.slot.fantraxId;
          if (picked === null) setPicked(id);
          // Tapping the picked man again asks for the rest of what he can do.
          // It used to put him back down, which is what the swap partners and
          // the dialog's own dismissal already do twice over.
          else if (picked === id) {
            setPicked(null);
            setOpened(id);
          } else if (partners.has(id)) swapWith(id);
        }}
      />

      {opened !== null ? (
        <MoveDialog
          key={opened}
          name={nameOf(opened)}
          moves={legalMoves(slots, eligibility, limits, opened)}
          options={eligibleSlots(slots, eligibility, limits, opened)}
          nameOf={nameOf}
          onPlay={play}
          onClose={() => setOpened(null)}
        />
      ) : null}

      {/* Nothing at all until something has been moved. A count of eleven from
          eleven is a line of furniture telling a manager what he can see. */}
      {dirty ? (
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="font-display text-2xs font-bold uppercase text-faint">
            Planned — not submitted
          </h2>
          <button
            type="button"
            onClick={() => {
              setSlots(team.players.map((p) => p.slot));
              setPicked(null);
            }}
            className="cm-bevel min-h-9 px-3 text-xs font-medium hover:brightness-110"
          >
            Reset
          </button>
        </div>
      ) : null}

      {broken.length > 0 || empty > 0 ? (
        <ul className="flex flex-col gap-1 border border-line bg-surface px-3 py-2">
          {broken.map((violation) => (
            <li key={sentence(violation, nameOf)} className="text-2xs text-bad">
              {sentence(violation, nameOf)}
            </li>
          ))}
          {/* Not a violation, and deliberately worded so it cannot be read as
              one: Fantrax publishes no minimum per position, so an under-filled
              XI breaks no rule the commissioner set. */}
          {empty > 0 ? (
            <li className="text-2xs text-muted">
              {empty} empty {empty === 1 ? "place" : "places"} in the XI — allowed, and nothing
              scores from them.
            </li>
          ) : null}
        </ul>
      ) : null}

      <a href={fantraxUrl} target="_blank" rel="noreferrer" className={BUTTON}>
        Set this lineup in Fantrax
      </a>
    </div>
  );
}
