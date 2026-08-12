import { ACTIVE, RESERVE, activeAt, isActive } from "./rosterStatus";
import type { RosterLimits, RosterSlot } from "./types";

// What a manager may legally do to their lineup, and what stops them.
//
// This is a PLANNER, not a writer. It answers "can he play there, and if not
// why not" so the app can show a legal XI being built; submitting it is still
// Fantrax's job. Nothing here touches the network.
//
// It lives in `league/` rather than `join/` because every input is league state:
// eligibility and caps are commissioner settings, and active/reserve is this
// week's assignment. Football contributes no facts to a legality question — a
// player's form has no bearing on whether the shape is allowed — so the 27/28
// engine inherits this file unchanged.
//
// What is WRONG with a lineup is a separate question and lives in
// `violations.ts`: nothing offered here can produce an illegal XI, so the two
// only ever meet on a roster Fantrax itself served.

/** fantraxId → the positions the commissioner deems them eligible for.
 *
 *  Multi-valued and commonly so: 48 of 697 players hold two positions today. An
 *  id absent from the map is not "eligible anywhere" — it is a player we have no
 *  eligibility for, and every function below refuses to move him. */
export type Eligibility = Map<string, string[]>;

export function eligibilityOf(
  players: readonly { fantraxId: string; eligiblePositions: string[] }[],
): Eligibility {
  return new Map(players.map((player) => [player.fantraxId, player.eligiblePositions]));
}

/** One change to a lineup. `to` is always where the moving player ends up. */
export type Move =
  | { kind: "promote"; fantraxId: string; to: string }
  | { kind: "demote"; fantraxId: string }
  | { kind: "shift"; fantraxId: string; to: string }
  /** `fantraxId` comes off the bench into `to`; `withId` goes to the bench. The
   *  only way to fill a position that is already at its cap. */
  | { kind: "swap"; fantraxId: string; withId: string; to: string };

/** Why a position is not available to a player.
 *
 *  Separate reasons because they lead to different offers: `position-full` is
 *  answerable with a swap, `squad-full` is answerable by demoting anyone, and
 *  `not-eligible` is not answerable at all. */
export type Blocker = "not-eligible" | "position-full" | "squad-full" | "unknown-eligibility";

export interface SlotOption {
  position: string;
  open: boolean;
  blockedBy?: Blocker;
}

/** Positions this league recognises, taken from its own caps.
 *
 *  Read from `RosterLimits`, never a G/D/M/F constant: the position vocabulary is
 *  a commissioner setting, and the two leagues already disagree about other parts
 *  of the roster. */
function positionsOf(limits: RosterLimits): string[] {
  return Object.keys(limits.maxActiveByPosition);
}

/** Every position in the league, and whether this player could take an active
 *  slot there as things stand.
 *
 *  Reports on all of them rather than only the open ones, because a UI that lists
 *  just the possibilities cannot explain the absences — and "why can't he play
 *  there" is the question a manager actually asks. */
export function eligibleSlots(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
  fantraxId: string,
): SlotOption[] {
  const eligible = eligibility.get(fantraxId);
  const slot = slots.find((s) => s.fantraxId === fantraxId);
  const alreadyActive = slot !== undefined && isActive(slot);
  const activeCount = slots.filter(isActive).length;

  return positionsOf(limits).map((position) => {
    if (eligible === undefined) {
      return { position, open: false, blockedBy: "unknown-eligibility" as const };
    }
    if (!eligible.includes(position)) {
      return { position, open: false, blockedBy: "not-eligible" as const };
    }

    // Already there: not a move, so not an option. Reported closed with no
    // blocker rather than open, so a UI cannot offer a no-op.
    if (alreadyActive && slot.position === position) return { position, open: false };

    const cap = limits.maxActiveByPosition[position] ?? 0;
    if (activeAt(slots, position).length >= cap) {
      return { position, open: false, blockedBy: "position-full" as const };
    }

    // A player already in the XI moving between positions does not grow it, so
    // the squad-wide cap only binds on the way in from the bench.
    if (!alreadyActive && activeCount >= limits.maxActivePlayers) {
      return { position, open: false, blockedBy: "squad-full" as const };
    }

    return { position, open: true };
  });
}

/** Everything this player could legally do right now.
 *
 *  A player with no recorded eligibility yields nothing at all. That is the honest
 *  answer — we do not know what he may play — and it is why absence is modelled
 *  rather than defaulted to "anywhere", which would offer a manager a move Fantrax
 *  then rejects. */
export function legalMoves(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
  fantraxId: string,
): Move[] {
  const slot = slots.find((s) => s.fantraxId === fantraxId);
  if (!slot) return [];
  const eligible = eligibility.get(fantraxId);
  if (eligible === undefined || eligible.length === 0) return [];

  const active = isActive(slot);
  const moves: Move[] = [];

  for (const option of eligibleSlots(slots, eligibility, limits, fantraxId)) {
    const to = option.position;
    if (option.open) {
      moves.push(active ? { kind: "shift", fantraxId, to } : { kind: "promote", fantraxId, to });
      continue;
    }
    if (active) continue;

    // Both ways of being full are answerable by a swap, and they are answerable
    // by DIFFERENT swaps — which matters, because a full XI is the ordinary
    // state of a team and offering nothing there would make the planner useless
    // exactly when it is needed.
    //
    // A full POSITION must be relieved by someone standing in it; swapping a
    // midfielder out to sign a third forward still leaves four forwards. A full
    // SQUAD is relieved by anyone at all, since one out and one in keeps the
    // count where it was.
    if (option.blockedBy === "position-full") {
      for (const occupant of activeAt(slots, to)) {
        moves.push({ kind: "swap", fantraxId, withId: occupant.fantraxId, to });
      }
    } else if (option.blockedBy === "squad-full") {
      for (const occupant of slots.filter(isActive)) {
        moves.push({ kind: "swap", fantraxId, withId: occupant.fantraxId, to });
      }
    }
  }

  const benched = slots.filter((s) => !isActive(s)).length;
  if (active && benched < limits.maxReservePlayers) moves.push({ kind: "demote", fantraxId });

  return moves;
}

/** Apply a move, returning a new roster. Never mutates its input: the planner
 *  holds the edited lineup beside the real one, and the real one has to survive a
 *  discarded plan. */
export function applyMove(slots: readonly RosterSlot[], move: Move): RosterSlot[] {
  return slots.map((slot) => {
    if (move.kind === "swap" && slot.fantraxId === move.withId) {
      return { ...slot, status: RESERVE };
    }
    if (slot.fantraxId !== move.fantraxId) return slot;

    switch (move.kind) {
      case "promote":
      case "swap":
        return { ...slot, position: move.to, status: ACTIVE };
      case "shift":
        return { ...slot, position: move.to };
      case "demote":
        return { ...slot, status: RESERVE };
    }
  });
}
