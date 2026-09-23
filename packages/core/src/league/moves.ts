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
    // A cap the league did not publish cannot block a move.
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

/** Whether a move would push a position further below the fewest the league
 *  allows to start there.
 *
 *  **Further below, not below.** A roster can arrive already short — the
 *  commissioner can RAISE a minimum under a filed side, which is the mirror of
 *  the cap case `overCap` exists for — and a planner that refused every move
 *  from that state would freeze on the one screen that could repair it. So the
 *  test is whether the move makes a line worse than it found it.
 *
 *  A position with no published minimum cannot be broken. Fantrax's public
 *  `getLeagueInfo` publishes none at all, so this is inert until the checked-in
 *  file reaches `RosterLimits` — see `minActiveByPosition`. */
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

/** Whether the XI is already breaking a cap this man stands inside.
 *
 *  The one state where taking somebody out and putting nobody in is the remedy
 *  rather than the problem: a commissioner can lower a cap under a side that was
 *  legal when it was filed, and did across the league on 12 Aug. */
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
  // A slot with no position at all breaks no published cap — Fantrax accepts one
  // and `lineup()` gives it a bucket — so there is nothing for him to be over.
  const position = slot.position;
  if (!position) return false;
  const cap = limits.maxActiveByPosition[position];
  return cap !== undefined && activeAt(slots, position).length > cap;
}

/** Everything this player could legally do right now — including the moves
 *  somebody else makes ON him, which is what "his bench" means when he is the one
 *  in the side.
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

  // **A man in the side goes off only when somebody takes his place** (Craig,
  // 21 Sep 2026: "dont allow to just put a player on the bench"). The swaps are
  // the same ones the reserves already offer, read from the other end rather
  // than derived a second time — one rule, so the pitch cannot light a partner
  // the dialog then refuses. No recursion: the reserve branch above never asks
  // this question back.
  //
  // It is also what makes the position caps a FORMATION rule. With the eleven
  // held at eleven, `maxActiveByPosition` fixes the fewest a line may hold —
  // this league's G1/D5/M5/F3 against an XI of 11 puts the floor at two at the
  // back and two in midfield — and no arrangement outside that is reachable.
  if (active) {
    for (const reserve of slots.filter((s) => !isActive(s))) {
      for (const move of legalMoves(slots, eligibility, limits, reserve.fantraxId)) {
        if (move.kind === "swap" && move.withId === fantraxId) moves.push(move);
      }
    }
  }

  const benched = slots.filter((s) => !isActive(s)).length;
  // A bench with no published cap has room: an unstated limit cannot be full.
  // Offered only to break a cap the XI is ALREADY over, which is the single case
  // a bare demotion repairs rather than causes.
  if (
    active &&
    overCap(slots, limits, slot) &&
    (limits.maxReservePlayers === null || benched < limits.maxReservePlayers)
  ) {
    moves.push({ kind: "demote", fantraxId });
  }

  // **The formation rule, and it is the league's rather than arithmetic.**
  // Holding the eleven at eleven keeps every line inside its CAP; the FLOOR is a
  // separate setting — D 3, M 2, F 1, G 1 in our league, which Fantrax enforces
  // and publishes only on the commissioner's own setup page. Applied by playing
  // each move and counting, rather than by reasoning per move kind: a swap moves
  // one man in and one man out and the two need not be the same position, and a
  // shift empties the line it left. One rule, and `applyMove` is pure.
  return moves.filter((move) => !worsensMinimum(slots, applyMove(slots, move), limits));
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
