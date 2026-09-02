"use client";

import Link from "next/link";
import {
  type BreakdownLine,
  type SquadPlayerDetail,
  contribution,
  isGoalkeeper,
  isResolved,
  kickedOff,
  playerName,
  signed,
} from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import Modal from "../shell/Modal";
import PlayerImage from "./PlayerImage";
import { chipsFor } from "./Chips";
import { londonDayAndTime } from "../../londonTime";
import { positionLabel } from "../../positions";
import { unresolvedReason } from "../../unresolved";
import { BUTTON } from "../shell/ButtonLink";

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
  reserve,
  onClose,
}: {
  player: SquadPlayerDetail;
  /** His categories, largest contribution first. Empty for a player the table
   *  names on nought, and for one it does not name at all — the difference is
   *  in `points`, which is the number the table actually gave. */
  breakdown: BreakdownLine[];
  /** Whether he is on the bench this period. The live table names only the
   *  eleven, so a reserve is absent from it for a reason that has nothing to do
   *  with whether he played — and saying "nothing has scored for him" over a
   *  man who played ninety minutes is two contradictions in one card. */
  reserve: boolean;
  onClose: () => void;
}) {
  const done = contribution(isResolved(rostered) ? rostered.stats : []);
  const started = kickedOff(opposition);
  // Only when there is one match to time. A double gameweek has two kickoffs and
  // naming the first beside two chips reads as the time of both.
  const kickoff = opposition?.length === 1 ? (opposition[0]?.fixture.kickoff ?? null) : null;

  return (
    <Modal onClose={onClose} width="24rem">
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
          <span className="w-[var(--player-card-figure)] shrink-0 overflow-hidden ">
            {isResolved(rostered) ? (
              <PlayerImage
                player={rostered.player}
                club={club}
                keeper={isGoalkeeper(rostered.slot.position)}
                kickedOff={started}
                sizes="88px"
              />
            ) : (
              <span className="grid aspect-[1.32] w-full place-items-center border border-dashed border-white/35 bg-black/25">
                <span className="numeric text-2xs font-bold text-white/70">
                  {positionLabel(rostered.slot.position) ?? "?"}
                </span>
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight">{playerName(rostered)}</h2>
            <p className="numeric text-2xs text-faint">
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
          <p className=" border border-line bg-raised px-3 py-2 text-2xs text-mid">
            {unresolvedReason(rostered.unresolved)}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border border-line bg-raised px-3 py-2">
          <span className="inline-flex w-[var(--player-card-figure)] overflow-hidden">
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
            <Breakdown
              breakdown={breakdown}
              points={points}
              reserve={reserve}
              minutes={done.minutes}
            />
            <p className="flex flex-wrap items-center gap-1 px-0.5 text-2xs text-faint">
              <span className="font-display font-bold uppercase">FPL records</span>
              <span className="numeric text-muted">{done.minutes}&apos;</span>
              {chipsFor(done).map((chip) => (
                <span
                  key={chip.label}
                  className={`numeric px-1 text-[0.625rem] font-bold leading-[1.4] ${chip.className}`}
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
            className={`${BUTTON} flex-1`}
          >
            Full profile
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={`${BUTTON} flex-1`}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** The itemised table: one row per category that moved his total, then the
 *  total itself. Read from Fantrax, never computed here — which is why the rows
 *  sum to the footer without anything checking that they do. */
function Breakdown({
  breakdown,
  points,
  reserve,
  minutes,
}: {
  breakdown: BreakdownLine[];
  points: number | null | undefined;
  reserve: boolean;
  /** What FPL says he actually played. The one thing that can tell "Fantrax has
   *  not named him yet" from "he did nothing". */
  minutes: number;
}) {
  // Three states and they are three different sentences. No table at all is
  // Fantrax refusing; a table that does not name him is a dash; a table that
  // gives him a number with no categories behind it is a real nought.
  if (points === undefined) {
    return (
      <p className=" border border-line bg-raised px-3 py-2 text-2xs text-mid">
        Fantrax would not give us this team&apos;s points, so there is nothing to break down. What
        he did is below, from FPL.
      </p>
    );
  }

  return (
    <div className="overflow-hidden border border-line">
      <div className="flex items-center justify-between gap-2 bg-raised px-3 py-1.5 font-display text-2xs font-bold uppercase text-faint">
        <span>This period</span>
        <span>Pts</span>
      </div>

      {breakdown.length === 0 ? (
        <p className="px-3 py-2 text-2xs text-muted">
          {/* Four different claims, and they were one sentence.
              A RESERVE is absent from this table because it names the eleven —
              nothing to do with whether he played, and the card prints his real
              minutes eleven lines below, so "nothing has scored for him" was
              contradicting itself in a single render.
              A total with no parts means Fantrax priced him and named a category
              this league's scoring does not describe; printing the raw
              identifier would be worse than printing nothing.
              A nought with minutes is a man who played and earned none.
              A nought with none is a man who did not play. */}
          {reserve
            ? "On the bench this period, so our league scores him nothing — whatever he did."
            : points
              ? "Fantrax scored him, but did not say what for."
              : minutes > 0
                ? "Nothing has scored for him yet."
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
                {signed(line.points)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 bg-raised px-3 py-2">
        <span className="font-display text-2xs font-bold uppercase text-muted">
          Total
        </span>
        <span className="numeric text-xl font-bold leading-none">{points ?? "—"}</span>
      </div>
    </div>
  );
}
