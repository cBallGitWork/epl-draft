"use client";

import Link from "next/link";
import {
  type BreakdownLine,
  type Opposition,
  type PlayerStory,
  type SquadPlayerDetail,
  contribution,
  isGoalkeeper,
  isResolved,
  kickedOff,
  playerName,
} from "@epl/core";
import { fdrStep } from "../football/FixtureChip";
import Modal from "../shell/Modal";
import Breakdown from "./Breakdown";
import FplRecords from "./FplRecords";
import PlayerImage from "./PlayerImage";
import { londonDayAndTime } from "../../londonTime";
import { positionLabel } from "../../positions";
import { unresolvedReason } from "../../unresolved";
import { BUTTON } from "../shell/ButtonLink";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// What a player is scoring, and why.
//
// A second card rather than a wider `PlayerCard`, because they answer different
// questions and are opened on different days. `PlayerCard` is "who is this, and
// is he fit" — read while going through somebody's fifteen midweek. This one is
// read at ten past four with a score on the screen, and the only question is
// which categories put him where he is.
//
// Every number in the breakdown is Fantrax's, under our league's own scoring,
// and the parts add up to the whole exactly. What he *did* is FPL's, joined
// through the identity bridge, and sits under its own heading: one is our
// competition's arithmetic and the other is the football.
//
// **It opens with a title bar, because Championship Manager opens every screen
// with one** (Craig, 21 Sep 2026: "its not very CM like"). The card was a stack
// of hairline boxes on the page's own ground — a modern web dialog — which is
// the same failure `ButtonLink` records talking itself out of a 1px border.
// DESIGN §2's table has the three surfaces and this now uses all three: the
// blue plate names the subject, the bevelled strip heads the figures, and the
// wells hold them.

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
  /** Whether he is on the bench this period. The live table names only the
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

  return (
    <Modal onClose={onClose} width="24rem">
      <div className="cm-titlebar flex items-center gap-2 px-3 py-2">
        <h2 className="cm-title min-w-0 flex-1 truncate text-xl font-bold tracking-tight">
          {playerName(rostered)}
        </h2>
        {/* The position his manager has him filling, not the list he is eligible
            for — a Fantrax player can hold several. In the index block because
            that is where CM puts the one-token fact beside a name, and because
            the club line below has no room to carry it at a readable size. */}
        <span className="cm-index numeric flex h-7 shrink-0 items-center px-2 text-sm font-bold">
          {positionLabel(rostered.slot.position) ?? "?"}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-3">
          {/* The photograph alone. It was a whole `PitchPlayer`, which carries a
              name plate and a points band — so the card printed his name twice
              and his total twice.

              A slot with no footballer behind it gets the same dashed box the
              pitch gives him rather than an empty rectangle: every slot on an
              open XI is tappable, so this card has to have something to say
              about all fifteen. */}
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
            <p className="truncate text-sm text-muted">{club?.name ?? "—"}</p>
            <Fixtures opposition={opposition} />
            <p className={QUIET_FIGURE}>
              {started
                ? `${done.minutes}' played`
                : kickoff
                  ? `Kicks off ${londonDayAndTime(kickoff)}`
                  : "Yet to play"}
            </p>
          </div>
        </div>

        {/* Why there is nobody behind the slot, in the same words `PlayerCard`
            uses. */}
        {isResolved(rostered) ? null : (
          <p className="cm-panel px-3 py-2 text-2xs text-mid">
            {unresolvedReason(rostered.unresolved)}
          </p>
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

/** Who he plays, at a size a dialog has the room for.
 *
 *  **Not `FixtureChip`** (Craig, 21 Sep 2026: "the long fixture graphics looks
 *  crap"). That component is built to fill four pixels of headroom under a
 *  sticker — `--text-3xs`, the last step on the scale, stretched edge to edge —
 *  and the card was giving it 88px of width to stretch across, which turns a
 *  three-letter label into a bar with a word at one end of it. Its own docblock
 *  says as much: "Rounding and width are the parent's business."
 *
 *  So it shares `fdrStep` and nothing else, which is exactly what that export
 *  was split out for. Third consumer of it, and the geometry is different at all
 *  three — a band under a sticker, a 44px block in a run, this — so the colour
 *  stays shared and the layout stays local (§1).
 */
function Fixtures({ opposition }: { opposition: Opposition[] | undefined }) {
  if (opposition === undefined || opposition.length === 0) {
    return <p className={`${LABEL} leading-6`}>No fixture</p>;
  }

  // One chip per fixture: a blank gameweek has none and a double has two, and
  // both halves of a double can be rated differently.
  return (
    <p className="flex flex-wrap items-center gap-1">
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
    </p>
  );
}

/** Fantrax's own words about him, when there are any from today.
 *
 *  The body and not the headline: `headlineNoBrief` is the same sentence
 *  truncated with an ellipsis, so printing both is printing one of them twice.
 *  The analysis is a paragraph and stays on the profile — this card is read with
 *  a match on. */
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
