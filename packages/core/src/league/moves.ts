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

/** Fantrax's own words for the two roster states. Mirrored here rather than
 *  reduced to a boolean: `RosterSlot.status` is carried raw precisely so a third
 *  value would surface instead of being silently folded into one of these. */
const ACTIVE = "ACTIVE";
const RESERVE = "RESERVE";

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

function isActive(slot: RosterSlot): boolean {
  return slot.status === ACTIVE;
}

function activeAt(slots: readonly RosterSlot[], position: string): RosterSlot[] {
  return slots.filter((slot) => isActive(slot) && slot.position === position);
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

/** A rule this lineup is currently breaking.
 *
 *  Reachable without anybody making an illegal move, which is the reason it
 *  exists: the lineup we are handed is Fantrax's, and a commissioner can narrow a
 *  player's eligibility or lower a cap under an XI that was legal when it was
 *  set. `legalMoves` will not create these states; nothing stops us being given
 *  one, and a planner that silently plans on top of it is lying by omission.
 *
 *  A SHORTFALL is deliberately not here. Fantrax publishes `maxActive` per
 *  position and no minimum, so "only two defenders" breaks no rule anyone set —
 *  ten men in an eleven-man XI is legal and merely wasteful, and saying so is the
 *  UI's job, not this type's. */
export type Violation =
  | { kind: "too-many-active"; count: number; cap: number }
  | { kind: "too-many-reserve"; count: number; cap: number }
  | { kind: "position-over-cap"; position: string; count: number; cap: number }
  | { kind: "not-eligible"; fantraxId: string; position: string };

/** Everything wrong with a lineup as it stands, or an empty list.
 *
 *  Reports all of them rather than the first, because they have different
 *  remedies and a manager fixing one at a time cannot see whether he is finished. */
export function violations(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
): Violation[] {
  const found: Violation[] = [];
  const active = slots.filter(isActive);

  if (active.length > limits.maxActivePlayers) {
    found.push({ kind: "too-many-active", count: active.length, cap: limits.maxActivePlayers });
  }

  // Counted as everyone who is not active, matching `legalMoves`: Fantrax's
  // status vocabulary is theirs, and a third value would be a reserve here rather
  // than vanishing from both counts.
  const reserves = slots.length - active.length;
  if (reserves > limits.maxReservePlayers) {
    found.push({ kind: "too-many-reserve", count: reserves, cap: limits.maxReservePlayers });
  }

  for (const [position, cap] of Object.entries(limits.maxActiveByPosition)) {
    const count = activeAt(slots, position).length;
    if (count > cap) found.push({ kind: "position-over-cap", position, count, cap });
  }

  for (const slot of active) {
    // A slot with no position at all breaks no published rule — Fantrax accepts
    // one and `lineup()` gives it a bucket — so there is nothing to report.
    if (!slot.position) continue;
    const eligible = eligibility.get(slot.fantraxId);
    // Eligibility we do not hold is not eligibility he lacks. Accusing a manager
    // of an illegal XI because our data is missing is the same confident wrong
    // answer `eligibleSlots` refuses to give, and here it would be worse: there
    // is no move that clears it.
    if (eligible === undefined || eligible.length === 0) continue;
    if (!eligible.includes(slot.position)) {
      found.push({ kind: "not-eligible", fantraxId: slot.fantraxId, position: slot.position });
    }
  }

  return found;
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
