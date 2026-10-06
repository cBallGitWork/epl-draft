import { ACTIVE, RESERVE, activeAt, isActive } from "./rosterStatus";
import type { RosterLimits, RosterSlot } from "./types";

// What a manager may legally do to his lineup and what stops him: a planner, never a writer.

/** fantraxId → the positions the commissioner deems him eligible for; an absent id is never moved. */
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
  /** `fantraxId` comes off the bench into `to`; `withId` goes to the bench. */
  | { kind: "swap"; fantraxId: string; withId: string; to: string };

/** Why a position is not available to a player; each reason leads to a different offer. */
type Blocker = "not-eligible" | "position-full" | "squad-full" | "unknown-eligibility";

interface SlotOption {
  position: string;
  open: boolean;
  blockedBy?: Blocker;
}

/** Positions this league recognises, read from its own caps and never a G/D/M/F constant. */
function positionsOf(limits: RosterLimits): string[] {
  return Object.keys(limits.maxActiveByPosition);
}

/** Every position in the league, and whether this player could take an active slot there now, with why not. */
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

    // Already there: closed with no blocker, so a UI cannot offer a no-op.
    if (alreadyActive && slot.position === position) return { position, open: false };

    const cap = limits.maxActiveByPosition[position] ?? 0;
    if (activeAt(slots, position).length >= cap) {
      return { position, open: false, blockedBy: "position-full" as const };
    }

    // The squad-wide cap binds only on the way in from the bench, and an unpublished cap blocks nothing.
    if (
      !alreadyActive &&
      limits.maxActivePlayers !== null &&
      activeCount >= limits.maxActivePlayers
    ) {
      return { position, open: false, blockedBy: "squad-full" as const };
    }

    return { position, open: true };
  });
}

/** Whether a move pushes a position FURTHER below its minimum, so a side already short is not frozen.
 *  A position with no published minimum cannot be broken. */
function worsensMinimum(
  before: readonly RosterSlot[],
  after: readonly RosterSlot[],
  limits: RosterLimits,
): boolean {
  for (const [position, min] of Object.entries(limits.minActiveByPosition)) {
    const was = activeAt(before, position).length;
    const now = activeAt(after, position).length;
    if (now < min && now < was) return true;
  }
  return false;
}

/** Whether the XI is already breaking a cap this man stands inside, as when a commissioner lowers one. */
function overCap(
  slots: readonly RosterSlot[],
  limits: RosterLimits,
  slot: RosterSlot,
): boolean {
  if (
    limits.maxActivePlayers !== null &&
    slots.filter(isActive).length > limits.maxActivePlayers
  ) {
    return true;
  }
  // A slot with no position breaks no published cap.
  const position = slot.position;
  if (!position) return false;
  const cap = limits.maxActiveByPosition[position];
  return cap !== undefined && activeAt(slots, position).length > cap;
}

/** Everything this player could legally do now, including the swaps a reserve makes on him.
 *  A player with no recorded eligibility yields nothing, never "anywhere". */
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

    // A full position is relieved by a swap with a man in it; a full squad by a swap with anyone.
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

  // A man in the side goes off only when somebody takes his place: the reserves' own swaps, read from his end.
  if (active) {
    for (const reserve of slots.filter((s) => !isActive(s))) {
      for (const move of legalMoves(slots, eligibility, limits, reserve.fantraxId)) {
        if (move.kind === "swap" && move.withId === fantraxId) moves.push(move);
      }
    }
  }

  const benched = slots.filter((s) => !isActive(s)).length;
  // A bare demotion only to repair a cap the XI is already over; an unpublished bench cap is never full.
  if (
    active &&
    overCap(slots, limits, slot) &&
    (limits.maxReservePlayers === null || benched < limits.maxReservePlayers)
  ) {
    moves.push({ kind: "demote", fantraxId });
  }

  // The league's minimum per line, checked by playing each move and counting.
  return moves.filter((move) => !worsensMinimum(slots, applyMove(slots, move), limits));
}

/** Apply a move, returning a new roster; never mutates its input, which must survive a discarded plan. */
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
