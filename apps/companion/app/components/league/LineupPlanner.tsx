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
import Pending from "./Pending";
import SquadRows from "./SquadRows";
import ViewToggle, { type View } from "./ViewToggle";
import { LABEL, PANEL } from "@/app/desk";
import OutLink from "../shell/OutLink";

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
    case "position-under-min":
      return `${violation.count} at ${violation.position} — the league wants ${violation.min}.`;
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
  // Opens on the PITCH, which is the one thing this screen is for — `Sheet`
  // opens on the list because a rival's squad is a list of who he has, and this
  // is the arrangement you came to change.
  const [view, setView] = useState<View>("pitch");
  const [picked, setPicked] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

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
      bench: arranged.bench.flatMap((p) => detail(p.slot)),
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

  return (
    <div className="flex flex-col gap-3">
      {/* **The formation line is gone** (Craig, 21 Sep 2026: "remove 1-3-4-3
          row"). It named the shape above the grass, and the grass draws the
          shape — four lines of cards is what a 1-3-4-3 looks like, and a reader
          who wants the string can count them. It cost the pitch 20px of its
          height budget at every width to say something the picture underneath it
          was already saying. */}
      {/* **A list as well as a pitch** (Craig, 21 Sep 2026), on `Sheet`'s
          control and `Sheet`'s components — the same `ViewToggle` and the same
          `SquadRows` a rival's locked squad draws.
          
          **At every width, which is where it parts from `Sheet`.** That screen
          hides the toggle above `lg` and stands the list beside the pitch,
          because both fit and a control choosing between two things you can
          already see does nothing. This pitch cannot take that: `LineupPitch`
          is the one ground with no second column beside it and is capped to the
          fold on its own width, so halving it for a list would shrink the only
          interactive surface in the app to make room for a read-only copy of
          what it already says. */}
      <div className="flex items-center justify-end gap-3 px-1 text-2xs">
        <div className="flex items-center gap-3">
          {/* Phone only, on `Sheet`'s reasoning: above `lg` both readings fit
              side by side, and a control choosing between two things already on
              screen is a control that does nothing. It also buys the grass back
              the 44px a tap target costs — `pitchfit` had the pitch clearing the
              fold by 5px at 1440 with the toggle in the column, and by 26 with
              it gone. */}
          <span className="lg:hidden">
            <ViewToggle view={view} onPick={setView} quiet />
          </span>
          <Pending points={pending} />
        </div>
      </div>

      {/* **One box round both** (Craig, 3 Sep 2026: "i like that the real team
          squad page has one box to contain the pitch and list. fantasy team
          pitch does not do this and it looks bad, copy real team"). He said it of
          this very screen and it was answered on the rival's; this is the same
          grid, the same breakpoint and the same panel. */}
      <section className={PANEL}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className={view === "list" ? "" : "hidden lg:block"}>

          <div className="flex flex-col gap-2">
          <SquadRows
            lines={rows.map((line) => ({ position: line.label, players: line.players }))}
            projected={false}
            eligibility={eligibleBy}
          />
          {bench.length === 0 ? null : (
            <>
              {/* The plate, and the same reason `TeamSheet` gives for it:
                  nothing prints on the bare ground (DESIGN §2), so a heading
                  between two panels draws its own. */}
              <p className={`cm-panel px-2 py-1 text-center ${LABEL}`}>Bench</p>
              <SquadRows
                lines={[{ position: "", players: bench }]}
                projected={false}
                eligibility={eligibleBy}
                head={false}
                reserve
              />
            </>
          )}
          </div>
        </div>

        <div className={view === "pitch" ? "" : "hidden lg:block"}>
      <LineupPitch
        inColumn
        rows={rows}
        bench={bench}
        pickStateOf={(player) => {
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
        </div>
      </div>
      </section>

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
          <h2 className={`font-display ${LABEL}`}>
            Planned — not submitted
          </h2>
          <button
            type="button"
            onClick={() => {
              setSlots(team.players.map((p) => p.slot));
              setPicked(null);
            }}
            className="cm-bevel min-h-11 px-3 text-xs font-medium hover:brightness-110 lg:min-h-9"
          >
            Reset
          </button>
        </div>
      ) : null}

      {broken.length > 0 || (empty !== null && empty > 0) ? (
        <ul className="flex flex-col gap-1 border border-line bg-surface px-3 py-2">
          {broken.map((violation) => (
            <li key={sentence(violation, nameOf)} className="text-2xs text-bad">
              {sentence(violation, nameOf)}
            </li>
          ))}
          {/* Not a violation, and deliberately worded so it cannot be read as
              one: Fantrax publishes no minimum per position, so an under-filled
              XI breaks no rule the commissioner set. */}
          {empty !== null && empty > 0 ? (
            <li className="text-2xs text-muted">
              {empty} empty {empty === 1 ? "place" : "places"} in the XI — allowed, and nothing
              scores from them.
            </li>
          ) : null}
        </ul>
      ) : null}

      <OutLink href={fantraxUrl}>Set this lineup in Fantrax</OutLink>
    </div>
  );
}
