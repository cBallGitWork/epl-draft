"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type BreakdownLine,
  type Club,
  type Opposition,
  type PlayerStory,
  type SquadPlayerDetail,
  clubColours,
  contribution,
  crestUrl,
  fullPlayerName,
  isGoalkeeper,
  isResolved,
  kickedOff,
  plateOn,
} from "@epl/core";
import { fdrStep } from "../football/FixtureChip";
import Modal from "../shell/Modal";
import Breakdown from "./Breakdown";
import FplRecords from "./FplRecords";
import PlayerImage from "./PlayerImage";
import Note from "./Note";
import { londonDayAndTime } from "../../londonTime";
import { positionLabel } from "../../positions";
import { unresolvedReason } from "../../unresolved";
import { BUTTON } from "../shell/ButtonLink";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// What a player is scoring, and why.
//
// A second card rather than a wider `PlayerCard`: that one is "who is this, and
// is he fit", read midweek. This is read at ten past four, and the only question
// is which categories put him where he is.
//
// Every number in the breakdown is Fantrax's, under our league's own scoring,
// and the parts add up to the whole exactly. What he *did* is FPL's, joined
// through the identity bridge, and sits under its own heading.
//
// The title bar is `PageHeader`'s plated mechanism in his club's colours, and it
// carries the name and nothing else (Craig, 21 Sep 2026: "prem team colour?").
// The position sits under it beside the club, where `PlayerCard` has it.

export default function LivePlayerCard({
  player: { rostered, club, opposition, points },
  breakdown,
  reserve,
  story,
  onClose,
}: {
  player: SquadPlayerDetail;
  /** His categories, largest contribution first. Empty for a player the table
   *  names on nought, and for one it does not name at all — the difference is
   *  in `points`, which is the number the table actually gave. */
  breakdown: BreakdownLine[];
  /** Whether he is on the bench this gameweek. The live table names only the
   *  eleven, so a reserve is absent from it for a reason that has nothing to do
   *  with whether he played — and saying "nothing has scored for him" over a
   *  man who played ninety minutes is two contradictions in one card. */
  reserve: boolean;
  /** Fantrax's latest on him, or null for the great majority. The pool feed is
   *  a day wide (`poolNews.ts`), so an absent story means nothing was filed
   *  today — never that there is none. */
  story?: PlayerStory | null;
  onClose: () => void;
}) {
  const done = contribution(isResolved(rostered) ? rostered.stats : []);
  const started = kickedOff(opposition);
  // Only when there is one match to time. A double gameweek has two kickoffs and
  // naming the first beside two chips reads as the time of both.
  const kickoff = opposition?.length === 1 ? (opposition[0]?.fixture.kickoff ?? null) : null;
  // A slot the bridge could not settle has no club, and so no colour of its own.
  const plate = club === undefined ? undefined : plateOn(clubColours(club.shortName));

  return (
    <Modal onClose={onClose} width="24rem">
      {/* `minHeight` INLINE, not `lg:min-h-0`: `desk.css` is unlayered and beats
          `@layer utilities`, so the utility loses silently. `.cm-titlebar`'s 96px
          above `lg` is a 1440 SCREEN's bar, not a 384px panel's. */}
      <div
        className="cm-titlebar flex items-center px-3 py-2"
        style={{ minHeight: 0, ...(plate ? { background: plate.background } : {}) }}
      >
        {/* His name in full rather than the one on his shirt (Craig, 21 Sep
            2026). A dialog is the one place about ONE man with the width for it. */}
        <h2
          className="cm-title min-w-0 flex-1 truncate text-xl font-bold tracking-tight"
          style={plate ? { color: plate.ink } : undefined}
        >
          {fullPlayerName(rostered)}
        </h2>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-3">
          {/* The photograph alone: a whole `PitchPlayer` carries a name plate
              and a points band, so the card printed both twice. A slot with no
              footballer gets the pitch's dashed box — every slot on an open XI
              is tappable, so the card answers for all fifteen. */}
          <span className="w-[var(--player-card-figure)] shrink-0 overflow-hidden">
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

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* The position his manager has him filling, not the list he is
                eligible for — a Fantrax player can hold several. */}
            <p className="truncate text-sm text-muted">
              {[club?.name, positionLabel(rostered.slot.position)].filter(Boolean).join(" · ") ||
                "—"}
            </p>
            <Fixtures club={club} opposition={opposition} />
            {/* Only before he has been on. "90' played" was the same figure the
                stats below open with (Craig, 21 Sep 2026); a kickoff time is
                not, because nothing below renders before one. */}
            {started ? null : (
              <p className={QUIET_FIGURE}>
                {kickoff ? `Kicks off ${londonDayAndTime(kickoff)}` : "Yet to play"}
              </p>
            )}
          </div>
        </div>

        {/* Why there is nobody behind the slot, in the same words `PlayerCard`
            uses. */}
        {isResolved(rostered) ? null : (
          <Note>
            {unresolvedReason(rostered.unresolved)}
          </Note>
        )}

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
            <FplRecords done={done} />
          </>
        ) : null}

        {story ? <Story story={story} /> : null}

        <div className="flex gap-2">
          <Link href={`/players/${rostered.slot.fantraxId}`} className={`${BUTTON} flex-1`}>
            Full profile
          </Link>
          <button type="button" onClick={onClose} className={`${BUTTON} flex-1`}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** His club, then who it plays: a crest, a "v", and the opponent (Craig, 21 Sep
 *  2026 — "put his team logo in and v opponent").
 *
 *  **Not `FixtureChip`.** That fills four pixels of headroom under a sticker and
 *  stretches edge to edge, so 88px turns three letters into a bar with a word at
 *  one end ("the long fixture graphics looks crap").
 *
 *  So it shares `fdrStep` and nothing else — third consumer, and the geometry
 *  differs at all three, so the colour stays shared and the layout stays local
 *  (§1).
 *
 *  **The `@` stays beside the "v".** It is this app's word for away in five
 *  places and it is Fantrax's own (`IPS 2 @MUN 5 F`); "v" says a fixture is
 *  being named and `@` says which end of it he is at. */
function Fixtures({
  club,
  opposition,
}: {
  club: Club | undefined;
  opposition: Opposition[] | undefined;
}) {
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      {club === undefined ? null : (
        // Decorative: the line above names his club in full.
        <Image src={crestUrl(club)} alt="" width={18} height={18} className="shrink-0" />
      )}
      {opposition === undefined || opposition.length === 0 ? (
        <span className={LABEL}>No fixture</span>
      ) : (
        <>
          <span className="text-2xs text-faint">v</span>
          {/* One chip per fixture: a blank gameweek has none and a double has
              two, and both halves of a double can be rated differently. */}
          {opposition.map((against) => (
            <span
              key={against.fixture.id}
              className={`numeric px-1.5 py-0.5 text-sm font-bold leading-snug ${fdrStep(against.difficulty).ink}`}
              style={{ backgroundColor: fdrStep(against.difficulty).ground }}
            >
              {against.home ? "" : "@"}
              {against.club.shortName}
            </span>
          ))}
        </>
      )}
    </p>
  );
}

/** Fantrax's own words about him, when there are any from today.
 *
 *  The body and not the headline: `headlineNoBrief` is the same sentence
 *  truncated, so printing both prints one of them twice. The analysis is a
 *  paragraph and stays on the profile — this card is read with a match on. */
function Story({ story }: { story: PlayerStory }) {
  return (
    <div className="cm-panel flex flex-col gap-1 px-2 py-1.5">
      <p className="flex items-baseline justify-between gap-2">
        <span className={LABEL}>News</span>
        {story.at === null ? null : (
          <span className={QUIET_FIGURE}>
            {londonDayAndTime(new Date(story.at).toISOString())}
          </span>
        )}
      </p>
      <p className="text-sm leading-snug text-ink">{story.content}</p>
    </div>
  );
}
