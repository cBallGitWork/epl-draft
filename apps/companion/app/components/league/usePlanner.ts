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
  eligibleSlots,
  isActive,
  legalMoves,
  lineup,
  playerName,
  violations,
} from "@epl/core";
import type { PitchRow } from "./PitchRows";
import { benchFrom, orderBench, swapInOrder } from "./benchOrder";

// The lineup planner's state: the slots being arranged, the pick in progress, and every move the
// league's rules allow from here. `LineupPlanner` draws it.

export function usePlanner(
  team: RosteredTeam,
  details: SquadPlayerDetail[],
  players: LeaguePlayerState[],
  limits: RosterLimits,
  /** Fantrax's bench order, `scorerId → rank`; empty when none is set. */
  benchRanks: Readonly<Record<string, number>>,
) {
  const [slots, setSlots] = useState<RosterSlot[]>(() => team.players.map((p) => p.slot));
  // What Fantrax holds, which a save moves forward: the slots and the bench order last saved.
  const [baseline, setBaseline] = useState<RosterSlot[]>(slots);
  const [savedOrder, setSavedOrder] = useState<string[]>(() =>
    benchFrom(benchRanks, lineup(team).bench.map((p) => p.slot.fantraxId)),
  );
  const [order, setOrder] = useState<string[]>(savedOrder);
  // Two ways in, and they are different questions, reached by the same target on
  // the first and second tap. `picked` is the quick swap: one tap chooses a man,
  // and the pitch answers "who can come off for him" by dimming everyone who
  // cannot. `opened` is the full list for one player, which is the only place a
  // move with no second player — off to the bench, across to another position —
  // can be offered.
  // Opens on the PITCH, which is the one thing this screen is for — `Sheet`
  // opens on the list because a rival's squad is a list of who he has, and this
  // is the arrangement you came to change.
  const [picked, setPicked] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  // **A tap on the LIST opens the man** (Craig, 21 Sep 2026: "list view, tap a
  // player - brings up player card"). The two views ask different questions and
  // the tap follows: the pitch is the arranging surface, where a tap picks him
  // and a second tap offers everywhere he can go; the list is the reading one,
  // where the question is "who is this, and is he fit". A rival's locked squad
  // already opens a card from both, and this was the one list in the app whose
  // rows looked like buttons and were not.
  const [card, setCard] = useState<SquadPlayerDetail | null>(null);

  const eligibility = useMemo(() => eligibilityOf(players), [players]);
  // The same fact in the shape the list wants. `SquadRows` takes a record
  // because its other callers hand it one across the server boundary, where a
  // `Map` arrives as `{}`; here it is already a map and the conversion is this
  // one line rather than a second prop threaded through the page.
  const eligibleBy = useMemo(() => Object.fromEntries(eligibility), [eligibility]);
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
  const { rows, bench } = useMemo(() => {
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

  // What is wrong with the XI as it stands. No move offered can create any of
  // it, so an empty list is the ordinary case and anything in it came from
  // Fantrax — which is exactly why it has to be said rather than assumed away.
  const broken = violations(slots, eligibility, limits);
  // **Null where the league has published no cap**, which is not nought free
  // places but no such thing as a free place: without a stated XI size there is
  // nothing for a shortfall to be measured against
  // (`RosterLimits.maxActivePlayers`). The notice below simply does not appear.
  const empty =
    limits.maxActivePlayers === null
      ? null
      : limits.maxActivePlayers - slots.filter(isActive).length;

  function play(move: Move) {
    setSlots((current) => applyMove(current, move));
    setPicked(null);
    setOpened(null);
  }

  // Everything the picked man may do, and the men he may do it with.
  //
  // **The other end of the swap, whichever end it was read from.** `legalMoves`
  // answers for a reserve with `fantraxId` as the man coming on, and for a man
  // already in the side with `withId` as himself — so a partner is "the id that
  // is not his", and reading only `withId` lit nothing at all when a manager
  // tapped one of his own eleven.
  const pickedMoves = picked === null ? [] : legalMoves(slots, eligibility, limits, picked);
  const partnerOf = (move: Move): string | null =>
    move.kind !== "swap" ? null : move.fantraxId === picked ? move.withId : move.fantraxId;
  const partners = new Set(pickedMoves.flatMap((move) => partnerOf(move) ?? []));

  /** Swapping with a man who occupies a position the picked player is eligible
   *  for means taking that position. Where he is not — a full XI lets him come
   *  in anywhere, so the partner need not be in a position he can fill — the
   *  first legal destination stands, because any of them is one man in and one
   *  man out. */
  function swapWith(partnerId: string) {
    const candidates = pickedMoves.flatMap((move) =>
      partnerOf(move) === partnerId ? [move] : [],
    );
    // Where the man COMING ON ends up, which is the picked player only when he
    // is the reserve. Tapping a defender in the side and then a reserve midfield
    // puts the midfielder in the defender's place, so the position that matters
    // is the one being vacated.
    const incoming = candidates[0]?.kind === "swap" ? candidates[0].fantraxId : null;
    const vacated = slots.find(
      (slot) => slot.fantraxId === (incoming === partnerId ? picked : partnerId),
    )?.position;
    const move = candidates.find((swap) => swap.kind === "swap" && swap.to === vacated) ?? candidates[0];
    // Only offered for a partner the pitch has lit, and it lit him from this
    // same list — so an empty one is unreachable rather than unhandled.
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

  /** A tap on a pitch card: pick him, open his moves on a second tap, or swap with the picked man. */
  function pick(player: SquadPlayerDetail) {
    const id = player.rostered.slot.fantraxId;
    if (picked === null) setPicked(id);
    else if (picked === id) {
      // A second tap opens the rest of what he can do; putting him back down is the dialog's job.
      setPicked(null);
      setOpened(id);
    } else if (partners.has(id)) swapWith(id);
    else if (benchSwap(id)) {
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
    play,
    card,
    setCard,
    opened,
    setOpened,
    pickStateOf,
    pick,
    reset,
    markSaved,
    plan: { slots, bench: benchIds },
    movesFor: (id: string) => legalMoves(slots, eligibility, limits, id),
    optionsFor: (id: string) => eligibleSlots(slots, eligibility, limits, id),
  };
}
