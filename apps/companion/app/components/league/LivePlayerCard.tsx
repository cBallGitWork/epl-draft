"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  type BreakdownLine,
  type SquadPlayerDetail,
  contribution,
  isGoalkeeper,
  isResolved,
  kickedOff,
  playerName,
} from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import PlayerImage from "./PlayerImage";
import { chipsFor } from "./Chips";
import { londonDayAndTime } from "../../londonTime";
import { positionLabel } from "../../positions";
import { unresolvedReason } from "../../unresolved";

// What a player is scoring, and why.
//
// A second card rather than a wider `PlayerCard`, because they answer different
// questions and are opened on different days. `PlayerCard` is "who is this, and
// is he fit" — read while going through somebody's fifteen midweek. This one is
// read at ten past four with a score on the screen, and the only question is
// which categories put him where he is.
//
// Every number in the table is Fantrax's, under our league's own scoring, and
// the parts add up to the whole exactly. That is the reason to read their
// breakdown instead of computing one: ours would have had to approximate the
// five categories FPL does not publish and then caveat every line.
//
// What he *did* — the goals, the clean sheet, the minutes — is FPL's, joined
// through the identity bridge, and says so. The two live in separate blocks on
// purpose: one is our competition's arithmetic and the other is the football.

export default function LivePlayerCard({
  player: { rostered, club, opposition, points },
  breakdown,
  projected,
  onClose,
}: {
  player: SquadPlayerDetail;
  /** His categories, largest contribution first. Empty for a player the table
   *  names on nought, and for one it does not name at all — the difference is
   *  in `points`, which is the number the table actually gave. */
  breakdown: BreakdownLine[];
  /** Whether these are Fantrax's projection rather than points played. The
   *  heading says which, because the numbers cannot. */
  projected: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const done = contribution(isResolved(rostered) ? rostered.stats : []);
  const started = kickedOff(opposition);
  // Only when there is one match to time. A double gameweek has two kickoffs and
  // naming the first beside two chips reads as the time of both.
  const kickoff = opposition?.length === 1 ? (opposition[0]?.fixture.kickoff ?? null) : null;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself; one on
      // anything inside lands on a child. That is the whole test.
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      className="m-auto w-[min(24rem,92vw)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          {/* The photograph alone. It was a whole `PitchPlayer`, which carries a
              name plate and a points band — so the card printed his name twice
              and his total twice, once on a sticker and once in the breakdown
              three lines below that exists to explain it.

              A slot with no footballer behind it gets the same dashed box the
              pitch gives him rather than an empty rectangle: every slot on an
              open XI is tappable, so this card has to have something to say
              about all fifteen. */}
          <span className="w-[var(--player-card-figure)] shrink-0 overflow-hidden rounded-lg">
            {isResolved(rostered) ? (
              <PlayerImage
                player={rostered.player}
                club={club}
                keeper={isGoalkeeper(rostered.slot.position)}
                kickedOff={started}
                sizes="88px"
              />
            ) : (
              <span className="grid aspect-[1.32] w-full place-items-center rounded-lg border border-dashed border-white/35 bg-black/25">
                <span className="numeric text-2xs font-bold text-white/70">
                  {positionLabel(rostered.slot.position) ?? "?"}
                </span>
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight">{playerName(rostered)}</h2>
            <p className="numeric text-2xs tracking-widest text-faint">
              {/* The position his manager has him filling, not the list he is
                  eligible for — a Fantrax player can hold several. */}
              {[club?.name, positionLabel(rostered.slot.position)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* Why there is nobody behind the slot, in the same words `PlayerCard`
            uses. Above the fixture panel, because it explains the blank the
            reader is already looking at. */}
        {isResolved(rostered) ? null : (
          <p className="rounded-lg border border-line bg-raised px-3 py-2 text-2xs text-mid">
            {unresolvedReason(rostered.unresolved)}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-raised px-3 py-2">
          <span className="inline-flex w-[var(--player-card-figure)] overflow-hidden rounded-[3px]">
            <FixtureChip opposition={opposition} blank="No fixture" />
          </span>
          <span className="numeric text-2xs text-faint">
            {started
              ? `${done.minutes}' played`
              : kickoff
                ? `Kicks off ${londonDayAndTime(kickoff)}`
                : "Yet to play"}
          </span>
        </div>

        {/* Nothing to explain before he has been on. An empty table under a live
            score reads as a score of nought, which is a different claim. */}
        {started ? (
          <>
            <Breakdown breakdown={breakdown} points={points} projected={projected} />
            <p className="flex flex-wrap items-center gap-1 px-0.5 text-2xs text-faint">
              <span className="font-display font-bold uppercase tracking-widest">FPL records</span>
              <span className="numeric text-muted">{done.minutes}&apos;</span>
              {chipsFor(done).map((chip) => (
                <span
                  key={chip.label}
                  className={`numeric rounded-[2px] px-1 text-[0.625rem] font-bold leading-[1.4] ${chip.className}`}
                >
                  {chip.label}
                </span>
              ))}
            </p>
          </>
        ) : null}

        <div className="flex gap-2">
          <Link
            href={`/players/${rostered.slot.fantraxId}`}
            className="min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
          >
            Full profile
          </Link>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 text-sm font-medium hover:bg-raised"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** The itemised table: one row per category that moved his total, then the
 *  total itself. Read from Fantrax, never computed here — which is why the rows
 *  sum to the footer without anything checking that they do. */
function Breakdown({
  breakdown,
  points,
  projected,
}: {
  breakdown: BreakdownLine[];
  points: number | null | undefined;
  projected: boolean;
}) {
  // Three states and they are three different sentences. No table at all is
  // Fantrax refusing; a table that does not name him is a dash; a table that
  // gives him a number with no categories behind it is a real nought.
  if (points === undefined) {
    return (
      <p className="rounded-lg border border-line bg-raised px-3 py-2 text-2xs text-mid">
        Fantrax would not give us this team&apos;s points, so there is nothing to break down. What
        he did is below, from FPL.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between gap-2 bg-raised px-3 py-1.5 font-display text-2xs font-bold uppercase tracking-widest text-faint">
        <span>{projected ? "Fantrax projects" : "This period"}</span>
        <span>Pts</span>
      </div>

      {breakdown.length === 0 ? (
        <p className="px-3 py-2 text-2xs text-muted">
          {/* A nought with no categories behind it is a man who has not played.
              A total with none is a different claim and must not wear the same
              sentence: Fantrax priced him, and named a category this league's
              own scoring system does not describe, so the parts are missing
              rather than absent. Printing the identifier instead would be worse
              than printing nothing. */}
          {points ? "Fantrax scored him, but did not say what for."
            : "Nothing has scored for him yet — his minutes have not registered either."}
        </p>
      ) : (
        <ul>
          {breakdown.map((line) => (
            <li
              key={line.code}
              className="flex min-h-8 items-center gap-2.5 border-b border-line px-3 py-1"
            >
              {/* Fantrax's own definition sits behind the label. It is where
                  they publish the rules a manager would otherwise have to guess
                  — what counts as a clean sheet is their sentence, not ours. */}
              <span
                className="min-w-0 flex-1 truncate text-sm text-muted"
                title={line.definition ?? undefined}
              >
                {line.name}
              </span>
              <span
                className={`numeric text-sm font-bold ${line.points < 0 ? "text-bad" : "text-ink"}`}
              >
                {line.points > 0 ? `+${line.points}` : line.points}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 bg-raised px-3 py-2">
        <span className="font-display text-2xs font-bold uppercase tracking-widest text-muted">
          Total
        </span>
        <span className="numeric text-xl font-bold leading-none">{points ?? "—"}</span>
      </div>
    </div>
  );
}
