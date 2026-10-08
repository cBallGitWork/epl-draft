import { useMemo, useState } from "react";
import type {
  LeaguePlayerState,
  Move,
  RosterLimits,
  RosterSlot,
  RosteredTeam,
  SquadPlayerDetail,
} from "@epl/core";
import {
  applyMove,
  eligibilityOf,
  isActive,
  legalMoves,
  lineup,
  playerName,
  violations,
} from "@epl/core";
import type { PitchRow } from "./PitchRows";
import { benchFrom, orderBench, swapInOrder } from "./benchOrder";
import { freeMoves } from "./openings";
import { pitchTap } from "./pitchTap";

// The lineup planner's state: the slots being arranged, the pick in progress, and every move the
// league's rules allow from here. `LineupPlanner` draws it.

export function usePlanner(
  team: RosteredTeam,
  details: SquadPlayerDetail[],
  players: LeaguePlayerState[],
  limits: RosterLimits,
  /** The order Fantrax will bring the bench on, `scorerId → rank`; empty when it could not be read. */
  benchRanks: Readonly<Record<string, number>>,
) {
  const [slots, setSlots] = useState<RosterSlot[]>(() => team.players.map((p) => p.slot));
  // What Fantrax holds, which a save moves forward: the slots and the bench order last saved.
  const [baseline, setBaseline] = useState<RosterSlot[]>(slots);
  const [savedOrder, setSavedOrder] = useState<string[]>(() =>
    benchFrom(benchRanks, lineup(team).bench.map((p) => p.slot.fantraxId)),
  );
  const [order, setOrder] = useState<string[]>(savedOrder);
  // The man picked on the pitch: the rest light where he can swap or move, and a second tap puts him down.
  const [picked, setPicked] = useState<string | null>(null);
  // The player card a tap on the list opens.
  const [card, setCard] = useState<SquadPlayerDetail | null>(null);

  const eligibility = useMemo(() => eligibilityOf(players), [players]);
  // The same fact as the record `SquadRows` takes: a `Map` crosses the server boundary as `{}`.
  const eligibleBy = useMemo(() => Object.fromEntries(eligibility), [eligibility]);
  const detailOf = useMemo(
    () => new Map(details.map((d) => [d.rostered.slot.fantraxId, d])),
    [details],
  );
  const nameOf = useMemo(() => {
    const names = new Map(details.map((d) => [d.rostered.slot.fantraxId, playerName(d.rostered)]));
    return (id: string) => names.get(id) ?? id;
  }, [details]);

  // The pitch draws the edited slots, through the same `lineup()` as the real team.
  const { rows, bench } = useMemo(() => {
    const bySlot = new Map(slots.map((slot) => [slot.fantraxId, slot]));
    const arranged = lineup({
      ...team,
      players: team.players.map((p) => ({ ...p, slot: bySlot.get(p.slot.fantraxId) ?? p.slot })),
    });
    // The joined detail carries the pre-move slot, so the edited one is spliced back in,
    // or a man would print his old position while standing in his new place.
    const detail = (slot: RosterSlot): SquadPlayerDetail[] => {
      const joined = detailOf.get(slot.fantraxId);
      return joined === undefined ? [] : [{ ...joined, rostered: { ...joined.rostered, slot } }];
    };
    return {
      rows: arranged.lines.map<PitchRow<SquadPlayerDetail>>((line) => ({
        label: line.position,
        players: line.players.flatMap((p) => detail(p.slot)),
      })),
      bench: orderBench(order, arranged.bench.map((p) => p.slot.fantraxId)).flatMap((id) => {
        const slot = bySlot.get(id);
        return slot === undefined ? [] : detail(slot);
      }),
    };
  }, [team, slots, order, detailOf]);
  const benchIds = bench.map((p) => p.rostered.slot.fantraxId);

  const moved = baseline.some((b, i) => b.status !== slots[i]?.status || b.position !== slots[i]?.position);
  const reordered = orderBench(savedOrder, benchIds).some((id, i) => benchIds[i] !== id);
  const dirty = moved || reordered;

  // What is wrong with the XI as it stands; no offered move creates any, so anything here came from Fantrax.
  const broken = violations(slots, eligibility, limits);
  // Null where the league publishes no XI size (`RosterLimits.maxActivePlayers`): no shortfall to measure.
  const empty =
    limits.maxActivePlayers === null
      ? null
      : limits.maxActivePlayers - slots.filter(isActive).length;

  function play(move: Move) {
    setSlots((current) => applyMove(current, move));
    setPicked(null);
  }

  // Everything the picked man may do. A swap's partner is the id that is not his: `legalMoves`
  // puts a reserve in `fantraxId` and a man already in the side in `withId`.
  const pickedMoves = picked === null ? [] : legalMoves(slots, eligibility, limits, picked);
  const partnerOf = (move: Move): string | null =>
    move.kind !== "swap" ? null : move.fantraxId === picked ? move.withId : move.fantraxId;
  const partners = new Set(pickedMoves.flatMap((move) => partnerOf(move) ?? []));
  // Where he can go with nobody coming off, drawn on the pitch as empty boxes.
  const free = freeMoves(pickedMoves);

  /** A tap on an empty box: the picked man moves into it. */
  function place(position: string) {
    const move = free.find((m) => m.to === position);
    if (move) play(move);
  }

  /** A swap takes the outgoing man's position where that is legal; otherwise the first legal destination stands. */
  function swapWith(partnerId: string) {
    const candidates = pickedMoves.flatMap((move) =>
      partnerOf(move) === partnerId ? [move] : [],
    );
    // The man coming on is the picked one only when he is the reserve; the position that matters is the one vacated.
    const incoming = candidates[0]?.kind === "swap" ? candidates[0].fantraxId : null;
    const vacated = slots.find(
      (slot) => slot.fantraxId === (incoming === partnerId ? picked : partnerId),
    )?.position;
    const move = candidates.find((swap) => swap.kind === "swap" && swap.to === vacated) ?? candidates[0];
    // Only offered for a partner the pitch lit from this same list, so an empty one is unreachable.
    if (move) play(move);
  }

  /** Whether a tap on `id` swaps two subs' places in the order the bench comes on. */
  const benchSwap = (id: string) => picked !== null && benchIds.includes(picked) && benchIds.includes(id);

  /** A pitch card's state while a pick is in progress. */
  function pickStateOf(player: SquadPlayerDetail): "idle" | "picked" | "swappable" | "blocked" {
    const id = player.rostered.slot.fantraxId;
    if (picked === null) return "idle";
    if (picked === id) return "picked";
    return partners.has(id) || benchSwap(id) ? "swappable" : "blocked";
  }

  /** A tap on a pitch card: pick him, put him down on a second tap, or swap with the picked man. */
  function pick(player: SquadPlayerDetail) {
    const id = player.rostered.slot.fantraxId;
    const tap = pitchTap(picked, id, { swap: partners.has(id), reorder: benchSwap(id) });
    if (tap === "pick") setPicked(id);
    else if (tap === "drop") setPicked(null);
    else if (tap === "swap") swapWith(id);
    else if (tap === "reorder" && picked !== null) {
      setOrder(swapInOrder(benchIds, picked, id));
      setPicked(null);
    }
  }

  function reset() {
    setSlots(baseline);
    setOrder(savedOrder);
    setPicked(null);
  }

  /** Fantrax now holds what is on screen. */
  function markSaved() {
    setBaseline(slots);
    setSavedOrder(benchIds);
  }

  return {
    rows,
    bench,
    eligibleBy,
    nameOf,
    dirty,
    broken,
    empty,
    card,
    setCard,
    pickStateOf,
    pick,
    openings: free.map((move) => move.to),
    place,
    reset,
    markSaved,
    plan: { slots, bench: benchIds, reordered, held: { slots: baseline, bench: savedOrder } },
  };
}
